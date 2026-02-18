import { db } from '../db/index.js';
import { tardinessSummary, policyViolations, employeeMemos, memoSequences, dailyTimeRecords, internalPolicies } from '../db/schema.js';
import { eq, and, sql, gte, lte } from 'drizzle-orm';



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

/**
 * Checks for policy violations based on CSC rules.
 * Rule: Habitual Tardiness/Undertime if 10x per month for 2 months in a semester.
 */
export const checkPolicyViolations = async (
  employeeId: string,
  year: number,
  month: number
): Promise<void> => {
  try {
    const currentSummaries = await db.select().from(tardinessSummary).where(and(
        eq(tardinessSummary.employeeId, employeeId),
        eq(tardinessSummary.year, year),
        eq(tardinessSummary.month, month)
      )).limit(1);
    const current = currentSummaries[0];

    if (!current) return;

    // Fetch Threshold from Policy (Default to 3 per user request)
    const policyRows = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'tardiness')).limit(1);
    const policyRow = policyRows[0];
    
    let habitualThreshold = 3; // USER REQUEST: 3x Lates = Violation
    try {
      if (policyRow?.content) {
        const content = typeof policyRow.content === 'string' ? JSON.parse(policyRow.content) : policyRow.content;
        habitualThreshold = Number(content.habitualThreshold) || 3;
      }
    } catch (e) {
      console.error('[POLICY] Error parsing tardiness policy:', e);
    }

    const typesToCheck: ('habitual_tardiness' | 'habitual_undertime' | 'absence')[] = [];
    
    // STRICT RULE: 3x Lates in a MONTH triggers "Habitual Tardiness"
    if ((current.totalLateCount || 0) >= habitualThreshold) typesToCheck.push('habitual_tardiness');
    // STRICT RULE: 3x Undertime in a MONTH triggers "Habitual Undertime"
    if ((current.totalUndertimeCount || 0) >= habitualThreshold) typesToCheck.push('habitual_undertime');

    // Absence check: 5 total OR check for consecutive
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    
    // Total Absence Check (e.g., 5 days)
    if ((current.totalAbsenceCount || 0) >= 5) {
      typesToCheck.push('absence');
    } else {
      // Consecutive Check: 3 days
      const dtrs = await db.select({ date: dailyTimeRecords.date, status: dailyTimeRecords.status })
        .from(dailyTimeRecords)
        .where(and(
          eq(dailyTimeRecords.employeeId, employeeId),
          gte(dailyTimeRecords.date, startDate),
          lte(dailyTimeRecords.date, endDate)
        ))
        .orderBy(dailyTimeRecords.date);
      
      let consecutiveAbsences = 0;
      for (const dtr of dtrs) {
        if (dtr.status === 'Absent') {
          consecutiveAbsences++;
          if (consecutiveAbsences >= 3) {
            if (!typesToCheck.includes('absence')) typesToCheck.push('absence');
            break;
          }
        } else {
          consecutiveAbsences = 0;
        }
      }
    }

    if (typesToCheck.length === 0) return;



    // STRICT FIX: Ensure current month violations trigger even without history
    // If we have > 0 types to check, we proceed.

    for (const type of typesToCheck) {
      const isLateCheck = type === 'habitual_tardiness';
      const isUndertimeCheck = type === 'habitual_undertime';
      const isAbsenceCheck = type === 'absence';

      // Absence triggers IMMEDIATELY if in typesToCheck
      // Tardiness/Undertime: Triggers IMMEDIATELY if strict 3x rule is met (User Request)
      // We removed the "2 months in a semester" requirement for this strict configuration.
      const isStrictTrigger = (isLateCheck || isUndertimeCheck) && (
        (isLateCheck && (current.totalLateCount || 0) >= habitualThreshold) ||
        (isUndertimeCheck && (current.totalUndertimeCount || 0) >= habitualThreshold)
      );

      if (isAbsenceCheck || isStrictTrigger) {
        // VIOLATION TRIGGERED
        await db.transaction(async (tx) => {
        // 1. Get exact dates for the triggering month
        const incidentRecords = await tx.select()
          .from(dailyTimeRecords)
          .where(and(
            eq(dailyTimeRecords.employeeId, employeeId),
            sql`YEAR(${dailyTimeRecords.date}) = ${year}`,
            sql`MONTH(${dailyTimeRecords.date}) = ${month}`,
            type === 'absence' ? eq(dailyTimeRecords.status, 'Absent') : (isLateCheck ? sql`${dailyTimeRecords.lateMinutes} > 0` : sql`${dailyTimeRecords.undertimeMinutes} > 0`)
          ));
          
          const incidentDates = incidentRecords.map(r => r.date).join(', ');

          // 2. Get Offense Level
          const existingOffenses = await tx.select({ count: sql<number>`count(*)` })
            .from(policyViolations)
            .where(and(
              eq(policyViolations.employeeId, employeeId),
              eq(policyViolations.type, type)
            ));
          
          const offenseLevel = (Number(existingOffenses[0].count) || 0) + 1;
          const memoNumber = await generateInternalMemoNumber(tx);

          // 3. Map Offense to Memo Type
          const memoTypeMap: Record<number, 'Verbal Warning' | 'Written Warning' | 'Suspension Notice' | 'Termination Notice' | 'Show Cause'> = {
            1: type === 'absence' ? 'Show Cause' : 'Written Warning',
            2: 'Suspension Notice',
            3: 'Termination Notice'
          };
          const memoType = memoTypeMap[offenseLevel] || 'Written Warning';

          // 4. Create Draft Memo
          const subject = type === 'absence' ? `NOTICE: UNEXPLAINED ABSENCE - Offense Level ${offenseLevel}` : `NOTICE: ${type.replace('_', ' ').toUpperCase()} - Offense Level ${offenseLevel}`;
          const violationLabel = type === 'absence' ? 'absence' : (isLateCheck ? 'tardiness' : 'undertime');

          const [memo] = await tx.insert(employeeMemos).values({
            memoNumber,
            employeeId: sql`(SELECT id FROM authentication WHERE employee_id = ${employeeId})`,
            authorId: sql`(SELECT id FROM authentication WHERE role = 'admin' LIMIT 1)`,
            memoType,
            subject,
            content: `This is an automated notice regarding your attendance records for ${month}/${year}. Our records indicate you have reached the threshold or consecutive limit for ${violationLabel} incidents (DATES: ${incidentDates}). This is your Level ${offenseLevel} offense.`,
            status: 'Draft',
            priority: 'High',
            effectiveDate: new Date().toISOString().split('T')[0]
          });

          // 5. Create Violation Record linked to Memo
          await tx.insert(policyViolations).values({
            employeeId,
            type,
            offenseLevel,
            memoId: memo.insertId,
            details: JSON.stringify({
              rule: "3x Strict Monthly Limit",
              triggerMonth: `${month}/${year}`,
              pastMonths: [],
              count: isLateCheck ? current.totalLateCount : current.totalUndertimeCount,
              dates: incidentDates.split(', ')
            }),
            status: 'pending'
          });
          console.log(`[POLICY] ${type} Violation logged for ${employeeId} (Offense Level ${offenseLevel})`);
        });
      }
    }
  } catch (error) {
    console.error('Error checking policy violations:', error);
  }
};
