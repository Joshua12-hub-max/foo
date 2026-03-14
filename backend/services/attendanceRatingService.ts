import { db } from '../db/index.js';
import { dailyTimeRecords, policyViolations, employeeMemos, authentication } from '../db/schema.js';
import { and, eq, gte, lte, inArray, ne } from 'drizzle-orm';

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

/**
 * Resolves the employee's numeric auth.id from a string or numeric identifier.
 * Handles both `auth.id` (int) and `auth.employeeId` (varchar "Emp-XXX") inputs.
 * Returns the numeric PK `auth.id` for tables that reference it (e.g., employeeMemos).
 * Returns the varchar `auth.employeeId` for tables that use it (e.g., DTR, violations).
 */
interface ResolvedEmployeeIds {
  authId: number;        // authentication.id (PK, int) — used by employeeMemos
  empIdStr: string;      // authentication.employeeId (varchar) — used by DTR, policyViolations
}

const resolveEmployeeIds = async (employeeId: string | number): Promise<ResolvedEmployeeIds | null> => {
  const inputStr = String(employeeId);
  const inputNum = Number(employeeId);

  // If the input looks like a number (e.g., from performanceReviews.employeeId which is int → auth.id)
  if (!isNaN(inputNum) && inputNum > 0) {
    const row = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId
    }).from(authentication).where(eq(authentication.id, inputNum)).limit(1);

    if (row.length > 0 && row[0].employeeId) {
      return { authId: row[0].id, empIdStr: row[0].employeeId };
    }
  }

  // If the input is a string like "Emp-001", look up by employeeId
  const row = await db.select({
    id: authentication.id,
    employeeId: authentication.employeeId
  }).from(authentication).where(eq(authentication.employeeId, inputStr)).limit(1);

  if (row.length > 0 && row[0].employeeId) {
    return { authId: row[0].id, empIdStr: row[0].employeeId };
  }

  return null;
};

export const calculateAttendanceScore = async (
  employeeId: string | number,
  startDate: string,
  endDate: string
): Promise<AttendanceScoreResult> => {
  // C1 FIX: Resolve both ID formats from a single lookup
  const resolved = await resolveEmployeeIds(employeeId);

  if (!resolved) {
    // Employee not found — return default outstanding (no data)
    return {
      score: 5,
      details: { totalLates: 0, totalUndertime: 0, totalAbsences: 0, totalLateMinutes: 0, ratingDescription: 'Outstanding (No Data)' }
    };
  }

  const { authId, empIdStr } = resolved;

  // DTR uses varchar employeeId (e.g., "Emp-001")
  const dtrRecords = await db.select()
  .from(dailyTimeRecords)
  .where(and(
      eq(dailyTimeRecords.employeeId, empIdStr),
      gte(dailyTimeRecords.date, startDate),
      lte(dailyTimeRecords.date, endDate)
  ));

  // S3 FIX: Policy violations — uses varchar employeeId, filtered by active status
  const violations = await db.select({
      id: policyViolations.id
  })
  .from(policyViolations)
  .where(and(
      eq(policyViolations.employeeId, empIdStr),
      inArray(policyViolations.type, ['habitual_tardiness', 'habitual_undertime', 'absence']),
      ne(policyViolations.status, 'cancelled'),
      ne(policyViolations.status, 'resolved'),
      gte(policyViolations.createdAt, `${startDate} 00:00:00`),
      lte(policyViolations.createdAt, `${endDate} 23:59:59`)
  ));

  const violationCount = violations.length;

  // C1 FIX: Memos use int auth.id (PK), NOT string employeeId
  // S3 FIX: Filter out Draft and Archived memos — only 'Sent' and 'Acknowledged' affect scores
  const memos = await db.select({
      severity: employeeMemos.severity
  })
  .from(employeeMemos)
  .where(and(
      eq(employeeMemos.employeeId, authId),
      inArray(employeeMemos.status, ['Sent', 'Acknowledged']),
      gte(employeeMemos.createdAt, `${startDate} 00:00:00`),
      lte(employeeMemos.createdAt, `${endDate} 23:59:59`)
  ));

  let hasTerminal = false;
  let hasGrave = false;
  let hasMajor = false;
  let hasModerate = false;
  let hasMinor = false;

  memos.forEach(memo => {
      if (memo.severity === 'terminal') hasTerminal = true;
      if (memo.severity === 'grave') hasGrave = true;
      if (memo.severity === 'major') hasMajor = true;
      if (memo.severity === 'moderate') hasModerate = true;
      if (memo.severity === 'minor') hasMinor = true;
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
      
      if (record.status === 'Absent' || record.status === 'AWOL' || record.status === 'No Logs') {
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

  // S4 FIX: ENFORCE CEILING CAPS BASED ON MEMO SEVERITY (all 5 levels)
  // These override the base score if a memo penalty was formally issued.
  if (hasTerminal || hasGrave) {
      score = 1;
      ratingDescription = hasTerminal
        ? 'Poor (Formally Reprimanded - Terminal Offense)'
        : 'Poor (Formally Reprimanded - Grave Offense)';
  } else if (hasMajor && score > 1) {
      score = 1;
      ratingDescription = 'Poor (Formally Reprimanded - Major Offense)';
  } else if (hasModerate && score > 2) {
      score = 2; // Ceiling of 2 for moderate offenses
      ratingDescription = 'Unsatisfactory (Formally Reprimanded - Moderate Offense)';
  } else if (hasMinor && score > 3) {
      score = 3; // Ceiling of 3 for minor offenses
      ratingDescription = 'Satisfactory (Formally Reprimanded - Minor Offense)';
  } 
  
  // S3 FIX: Failsafes — only count unresolved violations (already filtered above)
  if (violationCount > 0 && score > 1) {
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
