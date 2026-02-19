import db from '../db/index.js';
import type { RowDataPacket } from 'mysql2/promise';

interface DTRRow extends RowDataPacket {
  status: string;
  late_minutes: number;
  undertime_minutes: number;
}

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
  try {
    const [dtrRecords] = await db.query<DTRRow[]>(
      `SELECT status, late_minutes, undertime_minutes 
       FROM daily_time_records 
       WHERE employee_id = ? AND date BETWEEN ? AND ?`,
      [employeeId, startDate, endDate]
    );

    // Fetch Policy Violations within the period
    const [violations] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM policy_violations 
       WHERE employee_id = ? 
       AND (type LIKE '%Tardiness%' OR type LIKE '%Absenteeism%' OR type LIKE '%Undertime%')
       AND created_at BETWEEN ? AND ?`,
       [employeeId, startDate, endDate]
    );
    const violationCount = violations[0]?.count || 0;

    let totalLates = 0;
    let totalUndertime = 0;
    let totalAbsences = 0;
    let totalLateMinutes = 0;

    dtrRecords.forEach(record => {
        if (record.status === 'Late') {
            totalLates++;
            totalLateMinutes += (record.late_minutes || 0);
        }
        // Also catch if minutes > 0 even if status mismatch (safety)
        if (record.late_minutes > 0 && record.status !== 'Late') {
            totalLates++;
            totalLateMinutes += record.late_minutes;
        }
        
        if (record.undertime_minutes > 0) {
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
    // 2 - Unsatisfactory: > 10 instances OR > 120 mins late OR >= 2 Absences
    // 1 - Poor: Habitual (>= 3 absences OR >= 10 consecutive absences checks) OR Violation

    if (violationCount > 0) {
        score = 1;
        ratingDescription = `Poor (Has ${violationCount} Policy Violation/s)`;
    } else if (totalAbsences >= 3) {
        score = 1;
        ratingDescription = `Poor (Habitual Absenteeism: ${totalAbsences} days)`;
    } else if (totalLateMinutes > 240) { // > 4 hours total
        score = 1;
        ratingDescription = `Poor (Severe Tardiness: ${totalLateMinutes} mins)`;
    } else if (totalInstances === 0 && totalAbsences === 0 && totalLateMinutes === 0) {
        score = 5;
        ratingDescription = 'Outstanding';
    } else if (totalInstances <= 5 && totalLateMinutes <= 60 && totalAbsences === 0) {
        score = 4;
        ratingDescription = 'Very Satisfactory';
    } else if (totalInstances <= 10 && totalLateMinutes <= 120 && totalAbsences <= 1) {
        score = 3;
        ratingDescription = 'Satisfactory';
    } else if (totalInstances <= 15 || totalAbsences <= 2) {
        score = 2;
        ratingDescription = 'Unsatisfactory';
    } else {
        score = 1;
        ratingDescription = 'Poor';
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
  } catch (error) {
    console.error('Attendance Calculation Error:', error);
    // Return default max score if calculation fails to avoid penalizing unfairly on error
    return {
        score: 5, 
        details: {
            totalLates: 0,
            totalUndertime: 0,
            totalAbsences: 0,
            totalLateMinutes: 0,
            ratingDescription: 'Error calculating score, defaulting to 5'
        }
    };
  }
};
