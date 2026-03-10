import { db } from '../db/index.js';
import { tardinessSummary, policyViolations, employeeMemos, memoSequences, authentication } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import crypto from 'crypto';

interface ViolationConfig {
  violationType: 'habitualTardiness' | 'absence' | 'habitualUndertime';
  minMonthsPerOffense: number;
  pattern: 'consecutiveOrSemester';
  classification?: 'Simple Misconduct' | 'Prejudicial to Service';
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Generates a unique memo number (Internal helper)
 */
const generateInternalMemoNumber = async (tx: Transaction): Promise<string> => {
  const year = new Date().getFullYear();
  const existing = await tx.select().from(memoSequences).where(eq(memoSequences.year, year));
  
  let nextNumber: number;
  if (existing.length === 0) {
    await tx.insert(memoSequences).values({ year, lastNumber: 1 });
    nextNumber = 1;
  } else {
    nextNumber = existing[0].lastNumber + 1;
    await tx.update(memoSequences).set({ lastNumber: nextNumber }).where(eq(memoSequences.year, year));
  }
  return `MEMO-${year}-${String(nextNumber).padStart(4, '0')}`;
};

interface MonthlyViolationScan {
  yearMonth: string;
  lateCount: number;
  unauthorizedAbsences: number;
  undertimeCount: number;
  semester: number;
}

interface ViolationOffense {
  offenseNumber: 1 | 2 | 3;
  violationType: 'habitualTardiness' | 'absence' | 'habitualUndertime';
  classification?: 'Simple Misconduct' | 'Prejudicial to Service';
  triggeredMonths: string[];
  totalIncidents: number;
  fingerprint: string;
}

const getOrdinalSuffix = (i: number) => {
    const j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
};

class CSCViolationTracker {
  async identifyOffenses(employeeId: string): Promise<ViolationOffense[]> {
    const summaries = await db.select({
      year: tardinessSummary.year,
      month: tardinessSummary.month,
      lateCount: tardinessSummary.totalLateCount,
      undertimeCount: tardinessSummary.totalUndertimeCount,
      absenceCount: tardinessSummary.totalAbsenceCount
    }).from(tardinessSummary)
      .where(eq(tardinessSummary.employeeId, employeeId))
      .orderBy(asc(tardinessSummary.year), asc(tardinessSummary.month));

    const monthlyData: MonthlyViolationScan[] = summaries.map(s => ({
      yearMonth: `${s.year}-${String(s.month).padStart(2, '0')}`,
      lateCount: s.lateCount || 0,
      unauthorizedAbsences: s.absenceCount || 0,
      undertimeCount: s.undertimeCount || 0,
      semester: s.month <= 6 ? 1 : 2
    }));

    const offenses: ViolationOffense[] = [];

    const tardyMonths = monthlyData.filter(m => m.lateCount >= 10);
    offenses.push(...this.buildOffenseSequence(tardyMonths, {
      violationType: 'habitualTardiness',
      minMonthsPerOffense: 2,
      pattern: 'consecutiveOrSemester'
    }));

    const absenteeMonths = monthlyData.filter(m => m.unauthorizedAbsences > 2.5);
    offenses.push(...this.buildOffenseSequence(absenteeMonths, {
      violationType: 'absence',
      minMonthsPerOffense: 3,
      pattern: 'consecutiveOrSemester'
    }));

    const undertimeMonths = monthlyData.filter(m => m.undertimeCount >= 10);
    const classification = 'Simple Misconduct';
    
    offenses.push(...this.buildOffenseSequence(undertimeMonths, {
        violationType: 'habitualUndertime',
        classification,
        minMonthsPerOffense: 2,
        pattern: 'consecutiveOrSemester'
    }));

    return offenses;
  }

  private isConsecutiveMonth(prevYM: string, currYM: string): boolean {
    const [y1, m1] = prevYM.split('-').map(Number);
    const [y2, m2] = currYM.split('-').map(Number);
    if (y1 === y2) return m2 - m1 === 1;
    if (y2 - y1 === 1) return m1 === 12 && m2 === 1;
    return false;
  }

  private buildOffenseSequence(
    violatingMonths: MonthlyViolationScan[],
    config: ViolationConfig
  ): ViolationOffense[] {
    if (violatingMonths.length < config.minMonthsPerOffense) return [];
    
    const offenses: ViolationOffense[] = [];
    let currentOffense: MonthlyViolationScan[] = [];
    let offenseCounter = 1;
    
    for (let i = 0; i < violatingMonths.length; i++) {
      const current = violatingMonths[i];
      const prev = currentOffense[currentOffense.length - 1];
      
      const isConsecutive = prev && this.isConsecutiveMonth(prev.yearMonth, current.yearMonth);
      const prevYear = prev ? prev.yearMonth.substring(0,4) : null;
      const currYear = current.yearMonth.substring(0,4);
      const isSameSemester = prev && prevYear === currYear && prev.semester === current.semester;
      
      if (!prev || isConsecutive || (config.pattern === 'consecutiveOrSemester' && isSameSemester)) {
        currentOffense.push(current);
      } else {
        if (currentOffense.length >= config.minMonthsPerOffense) {
          offenses.push(this.createOffenseRecord(currentOffense, offenseCounter++, config));
        }
        currentOffense = [current];
      }

      if (currentOffense.length === config.minMonthsPerOffense) {
         offenses.push(this.createOffenseRecord(currentOffense, offenseCounter++, config));
         currentOffense = [];
      }
    }
    
    return offenses;
  }

  private createOffenseRecord(
    months: MonthlyViolationScan[],
    offenseNumber: number,
    config: ViolationConfig
  ): ViolationOffense {
    const triggeredMonths = months.map(m => m.yearMonth);
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${config.violationType}-${triggeredMonths.sort().join(',')}-${offenseNumber}`)
      .digest('hex');
      
    return {
      offenseNumber: Math.min(offenseNumber, 3) as 1 | 2 | 3,
      violationType: config.violationType,
      classification: config.classification,
      triggeredMonths,
      totalIncidents: months.reduce((sum, m) => sum + (config.violationType === 'habitualTardiness' ? m.lateCount : (config.violationType === 'absence' ? m.unauthorizedAbsences : m.undertimeCount)), 0),
      fingerprint
    };
  }
}

type MemoTypeStr = 'Verbal Warning' | 'Written Warning' | 'Reprimand' | 'Suspension Notice' | 'Termination Notice' | 'Show Cause';
type SeverityStr = 'minor' | 'moderate' | 'major' | 'grave' | 'terminal';

interface Penalty {
  penalty: string;
  memoType: MemoTypeStr;
  severity: SeverityStr;
}



const penaltyMatrix: Record<string, { regular: Penalty[]; joCos: Penalty[] }> = {
    'habitualTardiness': {
      regular: [
        { penalty: 'Reprimand (Stern Warning)', memoType: 'Reprimand', severity: 'minor' },
        { penalty: 'Suspension of one (1) to thirty (30) days', memoType: 'Suspension Notice', severity: 'major' },
        { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
      ],
      joCos: [
        { penalty: 'Warning', memoType: 'Written Warning', severity: 'minor' },
        { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
        { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
      ]
    },
    'absence': {
      regular: [
        { penalty: 'Suspension of six (6) months and one (1) day', memoType: 'Suspension Notice', severity: 'grave' },
        { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' },
        { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
      ],
      joCos: [
        { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
        { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' },
        { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
      ]
    },
    'habitual_undertime-Simple Misconduct': {
      regular: [
        { penalty: 'Reprimand (Stern Warning)', memoType: 'Reprimand', severity: 'minor' },
        { penalty: 'Suspension of one (1) to thirty (30) days', memoType: 'Suspension Notice', severity: 'major' },
        { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
      ],
      joCos: [        { penalty: 'Warning', memoType: 'Written Warning', severity: 'minor' },
        { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
        { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
      ]
    },
    'habitual_undertime-Prejudicial to Service': {
      regular: [
        { penalty: 'Suspension of six (6) months and one (1) day to one (1) year', memoType: 'Suspension Notice', severity: 'grave' },
        { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' },
        { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
      ],
      joCos: [        { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
        { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' },
        { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
      ]
    }
};

const generateMemoContent = (offense: ViolationOffense, penalty: Penalty, employeeTypeStr: string, employeeIdStr: string): string => {
  const monthsList = offense.triggeredMonths.join(', ');
  const displayLabel = offense.violationType === 'habitualTardiness' ? 'Habitual Tardiness' : (offense.violationType === 'absence' ? 'Habitual Absenteeism' : 'Habitual Undertime');
  
  return `MEMORANDUM

TO: ${employeeIdStr}
FROM: City Human Resource Management Officer
SUBJECT: ${displayLabel} - ${offense.offenseNumber}${getOrdinalSuffix(offense.offenseNumber)} Offense

This is to inform you that you have been found guilty of ${displayLabel} based on the following periods: ${monthsList}.

As ${employeeTypeStr}, you are hereby issued a ${penalty.penalty}.

This memo serves as your official notice. Please acknowledge receipt within 24 hours.`.trim();
};

/**
 * Checks for policy violations based on CSC rules.
 * Rule: Habitual Tardiness/Undertime if 10x per month for 2 months in a semester.
 */
export const checkPolicyViolations = async (
  employeeId: string,
  _year: number,
  _month: number
): Promise<void> => {
  try {
    const tracker = new CSCViolationTracker();
    const offenses = await tracker.identifyOffenses(employeeId);

    if (offenses.length === 0) return;

    // Get Employee Type and details
    const empRecord = await db.select({ id: authentication.id, dutyType: authentication.dutyType, appointmentType: authentication.appointmentType }).from(authentication).where(eq(authentication.employeeId, employeeId)).limit(1);
    const adminRecord = await db.select({ id: authentication.id }).from(authentication).where(eq(authentication.role, 'Administrator')).limit(1);
    
    if (empRecord.length === 0) return;
    const authorIdValue = adminRecord.length > 0 ? adminRecord[0].id : empRecord[0].id;
    
    // Penalty track is determined by appointmentType, NOT dutyType
    // JO, COS, Job Order, Contract of Service → JO/COS track
    // Permanent, Contractual, Casual, Coterminous, Temporary → Regular track
    const joCosTypes = ['Job Order', 'JO', 'Contract of Service', 'COS'];
    const appointmentType = empRecord[0].appointmentType || 'Permanent';
    const isRegular = !joCosTypes.includes(appointmentType);
    const employeeTypeStr = isRegular ? 'Regular Personnel' : 'Job Order/Contract of Service Personnel';

    for (const offense of offenses) {
      // Fingerprint deduplication check inside loop
      const existing = await db.select({ id: policyViolations.id })
        .from(policyViolations)
        .where(eq(policyViolations.fingerprint, offense.fingerprint))
        .limit(1);

      if (existing.length > 0) {
        continue; // Already penalized for these exact months & offense number
      }

      const matrixKey = offense.violationType === 'habitualUndertime' 
        ? `habitualUndertime-${offense.classification || 'Simple Misconduct'}`
        : offense.violationType;
        
      const penalties = isRegular ? penaltyMatrix[matrixKey].regular : penaltyMatrix[matrixKey].joCos;
      const penaltyIndex = Math.min(offense.offenseNumber - 1, penalties.length - 1);
      const penalty = penalties[penaltyIndex];

      const displayLabel = offense.violationType === 'habitualTardiness' ? 'Habitual Tardiness' : (offense.violationType === 'absence' ? 'Habitual Absenteeism' : 'Habitual Undertime');
      const subject = `${displayLabel} - ${offense.offenseNumber}${getOrdinalSuffix(offense.offenseNumber)} Offense`;

      await db.transaction(async (tx) => {
          const memoNumber = await generateInternalMemoNumber(tx);

          // Get date of the last triggered month
          const lastMonth = offense.triggeredMonths[offense.triggeredMonths.length - 1];
          const [yyyy, mm] = lastMonth.split('-').map(Number);
          const lastDay = new Date(yyyy, mm, 0).getDate();
          const effectiveDateStr = `${yyyy}-${String(mm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          const createdAtStr = `${effectiveDateStr} 17:00:00`;

          const [memo] = await tx.insert(employeeMemos).values({
            memoNumber,
            employeeId: empRecord[0].id,
            authorId: authorIdValue,
            memoType: penalty.memoType,
            subject,
            content: generateMemoContent(offense, penalty, employeeTypeStr, employeeId),
            status: 'Draft',
            priority: 'High',
            severity: penalty.severity,
            effectiveDate: effectiveDateStr,
            createdAt: createdAtStr
          });

          await tx.insert(policyViolations).values({
            employeeId: employeeId,
            type: (offense.violationType === 'habitualTardiness' ? 'habitual_tardiness' : 
                   offense.violationType === 'habitualUndertime' ? 'habitual_undertime' : 
                   offense.violationType) as 'habitual_tardiness' | 'habitual_undertime' | 'absence',
            violationSubtype: offense.classification,
            offenseNumber: offense.offenseNumber,
            offenseLevel: offense.offenseNumber,
            triggeredMonths: JSON.stringify(offense.triggeredMonths),
            fingerprint: offense.fingerprint,
            memoId: memo.insertId,
            details: JSON.stringify({
              penaltyIssued: penalty.penalty,
              employeeType: employeeTypeStr,
              severity: penalty.severity,
              rule: "CSC MC No. 1, s. 2017 & CGM Matrix",
              totalIncidents: offense.totalIncidents
            }),
            status: 'pending'
          });
          console.warn(`[POLICY] ${offense.violationType} logged for ${employeeId} (Fingerprint: ${offense.fingerprint})`);
      });
    }
  } catch (error) {
    console.error('Error checking policy violations:', error);
  }
};
