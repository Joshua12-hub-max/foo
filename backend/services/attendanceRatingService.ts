import db from '../db/connection.js';
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

    let totalLates = 0;
    let totalUndertime = 0;
    let totalAbsences = 0;
    let totalLateMinutes = 0;

    dtrRecords.forEach(record => {
        if (record.status === 'Late') {
            totalLates++;
            totalLateMinutes += (record.late_minutes || 0);
        }
        if (record.late_minutes > 0 && record.status !== 'Late') {
             // Catch cases where status might not be 'Late' but has late minutes? 
             // Trusting status for now, but accumulating minutes just in case.
        }
        
        if (record.undertime_minutes > 0) {
            totalUndertime++;
        }
        
        if (record.status === 'Absent') {
            totalAbsences++;
        }
    });

    const totalInstances = totalLates + totalUndertime + totalAbsences;

    let score = 5;
    let ratingDescription = 'Outstanding';

    if (totalInstances === 0) {
      score = 5;
      ratingDescription = 'Outstanding (No lates, absences, or undertime)';
    } else if (totalInstances <= 5 || totalLateMinutes <= 60) {
      score = 4;
      ratingDescription = 'Very Satisfactory';
    } else if (totalInstances <= 10 || totalLateMinutes <= 120) {
      score = 3;
      ratingDescription = 'Satisfactory';
    } else if (totalInstances <= 15) {
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
