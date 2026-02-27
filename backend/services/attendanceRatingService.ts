import { db } from '../db/index.js';
import { dailyTimeRecords, policyViolations, employeeMemos } from '../db/schema.js';
import { and, eq, gte, lte, inArray } from 'drizzle-orm';

interface AttendanceScoreResult {
  score: number; // 1-5
  details: {
    totalLates: number;
    totalUndertime: number;
    totalAbsences: number;
    totalLateMinutes: number;
    ratingDescription: string;
  };
}

export const calculateAttendanceScore = async (
  employeeId: string | number,
  startDate: string,
  endDate: string
): Promise<AttendanceScoreResult> => {
  const empIdStr = String(employeeId);

  // Parse strings to full date boundaries if needed, but since date column is date YYYY-MM-DD
  // and created_at is timestamp, we use string comparisons compatible with MySQL
  const dtrRecords = await db.select()
  .from(dailyTimeRecords)
  .where(and(
      eq(dailyTimeRecords.employeeId, empIdStr),
      gte(dailyTimeRecords.date, startDate),
      lte(dailyTimeRecords.date, endDate)
  ));

  // Fetch Policy Violations within the period
  const violations = await db.select({
      id: policyViolations.id
  })
  .from(policyViolations)
  .where(and(
      eq(policyViolations.employeeId, empIdStr),
      inArray(policyViolations.type, ['habitual_tardiness', 'habitual_undertime', 'absence']),
      gte(policyViolations.createdAt, `${startDate} 00:00:00`),
      lte(policyViolations.createdAt, `${endDate} 23:59:59`)
  ));

  const violationCount = violations.length;

  // Fetch issued Memos within the period to enforce strict Performance Ceilings
  const memos = await db.select({
      severity: employeeMemos.severity
  })
  .from(employeeMemos)
  .where(and(
      eq(employeeMemos.employeeId, Number(employeeId)),
      gte(employeeMemos.createdAt, `${startDate} 00:00:00`),
      lte(employeeMemos.createdAt, `${endDate} 23:59:59`)
  ));

  let hasMajor = false;
  let hasModerate = false;
  let hasMinor = false;
  let memoCount = 0;

  memos.forEach(memo => {
      if (memo.severity === 'major') hasMajor = true;
      if (memo.severity === 'moderate') hasModerate = true;
      if (memo.severity === 'minor') hasMinor = true;
      memoCount++;
  });

  let totalLates = 0;
  let totalUndertime = 0;
  let totalAbsences = 0;
  let totalLateMinutes = 0;

  dtrRecords.forEach(record => {
      const isStatusLate = record.status === 'Late' || record.status === 'Late/Undertime';
      const isStatusUndertime = record.status === 'Undertime' || record.status === 'Late/Undertime';
      const lateMins = record.lateMinutes || 0;
      const underMins = record.undertimeMinutes || 0;

      if (isStatusLate || lateMins > 0) {
          totalLates++;
          totalLateMinutes += lateMins;
      }
      
      if (isStatusUndertime || underMins > 0) {
          totalUndertime++;
      }
      
      if (record.status === 'Absent' || record.status === 'AWOL') {
          totalAbsences++;
      }
  });

  const totalInstances = totalLates + totalUndertime;

  let score = 5;
  let ratingDescription = 'Outstanding';

  // Strict Scoring Logic (Reference: CSC / Internal Policy)
  // 5 - Outstanding: No lates, no undertime, no absences.
  // 4 - Very Satisfactory: <= 5 instances AND <= 60 mins late AND 0 Absences
  // 3 - Satisfactory: <= 10 instances AND <= 120 mins late AND <= 1 Absence
  // 2 - Unsatisfactory: <= 15 instances AND <= 2 Absences
  // 1 - Poor: Habitual (>= 3 absences OR >= 10 consecutive absences checks) OR Violation

  // Apply base score calculations
  if (totalInstances === 0 && totalAbsences === 0 && totalLateMinutes === 0) {
      score = 5;
      ratingDescription = 'Outstanding';
  } else if (totalInstances <= 5 && totalLateMinutes <= 60 && totalAbsences === 0) {
      score = 4;
      ratingDescription = 'Very Satisfactory';
  } else if (totalInstances <= 10 && totalLateMinutes <= 120 && totalAbsences <= 1) {
      score = 3;
      ratingDescription = 'Satisfactory';
  } else if (totalInstances <= 15 && totalAbsences <= 2) { 
      score = 2;
      ratingDescription = 'Unsatisfactory';
  } else {
      score = 1;
      ratingDescription = 'Poor';
  }

  // ENFORCE CEILING CAPS BASED ON MEMO SEVERITY
  // These override the base score if a memo penalty was formally issued.
  if (hasMajor) {
      score = 1;
      ratingDescription = `Poor (Formally Reprimanded - Major Offense)`;
  } else if (hasModerate && score > 2) {
      score = 2; // Ceiling of 2 for moderate offenses
      ratingDescription = `Unsatisfactory (Formally Reprimanded - Moderate Offense)`;
  } else if (hasMinor && score > 3) {
      score = 3; // Ceiling of 3 for minor offenses
      ratingDescription = `Satisfactory (Formally Reprimanded - Minor Offense)`;
  } 
  
  // Failsafes for extreme violations that bypassed memos or were ignored
  else if (violationCount > 0 && score > 1) {
      score = 1;
      ratingDescription = `Poor (Has ${violationCount} Unresolved Policy Violation/s)`;
  } else if (totalAbsences >= 3 && score > 1) {
      score = 1;
      ratingDescription = `Poor (Habitual Absenteeism: ${totalAbsences} days)`;
  } else if (totalLateMinutes > 240 && score > 1) { // > 4 hours total
      score = 1;
      ratingDescription = `Poor (Severe Tardiness: ${totalLateMinutes} mins)`;
  }

  return {
    score,
    details: {
      totalLates,
      totalUndertime,
      totalAbsences,
      totalLateMinutes,
      ratingDescription
    }
  };
};
