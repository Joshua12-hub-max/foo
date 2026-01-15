import { Request, Response } from 'express';
import db from '../db/connection.js';
import { processDailyAttendance } from '../services/attendanceProcessor.js';
import type { RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import { GetLogsSchema, GetTodayStatusSchema } from '../schemas/attendanceSchema.js';

// ============================================================================
// Interfaces
// ============================================================================

interface DTRRow extends RowDataPacket {
  employee_id: string;
  date: Date;
  time_in?: Date;
  time_out?: Date;
  status: string;
  late_minutes: number;
  undertime_minutes: number;
  first_name?: string;
  last_name?: string;
  department?: string;
  updated_at: Date;
}

interface EmployeeWithSchedule extends RowDataPacket {
  employee_id: string;
  first_name: string;
  last_name: string;
  department?: string;
  job_title?: string;
  date_hired?: Date;
  employment_status?: string;
  is_rest_day?: number;
  start_time?: string;
  end_time?: string;
}

interface LeaveRow extends RowDataPacket {
  employee_id: string;
  first_name: string;
  last_name: string;
  department?: string;
  leave_type: string;
  start_date: Date;
  end_date: Date;
}

interface AttendanceLogRow extends RowDataPacket {
  id: number;
  employee_id: string;
  scan_time: Date;
  type: 'IN' | 'OUT';
  source: string;
  first_name?: string;
  last_name?: string;
  department?: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// Helpers
// ============================================================================

const handleError = (res: Response, error: Error, context: string): void => {
  console.error(`Error in ${context}:`, error);
  res.status(500).json({
    success: false,
    message: `An unexpected error occurred in ${context}.`,
    data: null
  });
};

const getLocalDate = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const formatTime = (dateTime: Date | null | undefined): string => {
  if (!dateTime) return '-';
  const date = new Date(dateTime);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (dateString: Date | string | null | undefined): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ============================================================================
// Controllers
// ============================================================================

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const employeeId = authReq.user.employeeId;

  if (!employeeId) {
    res.status(400).json({ success: false, message: 'User not authenticated or missing Employee ID.', data: null });
    return;
  }

  try {
    const scanTime = new Date();
    const dateStr = getLocalDate();

    await db.query(
      "INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, 'IN', 'WEB')",
      [employeeId, scanTime]
    );

    await processDailyAttendance(employeeId, dateStr);

    res.status(201).json({
      success: true,
      message: 'Clock in successful.',
      data: { timeIn: scanTime }
    });
  } catch (err) {
    handleError(res, err as Error, 'clockIn');
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const employeeId = authReq.user.employeeId;

  if (!employeeId) {
    res.status(400).json({ success: false, message: 'User not authenticated or missing Employee ID.', data: null });
    return;
  }

  try {
    const scanTime = new Date();
    const dateStr = getLocalDate();

    await db.query(
      "INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, 'OUT', 'WEB')",
      [employeeId, scanTime]
    );

    await processDailyAttendance(employeeId, dateStr);

    res.status(200).json({
      success: true,
      message: 'Clock out successful.',
      data: { timeOut: scanTime }
    });
  } catch (err) {
    handleError(res, err as Error, 'clockOut');
  }
};

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  const validation = GetLogsSchema.safeParse(req);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters.',
      errors: validation.error.format()
    });
    return;
  }

  const { query } = validation.data;
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const isAdminOrHr = ['admin', 'hr'].includes(user.role?.toLowerCase());

  const targetEmployeeId = isAdminOrHr 
    ? (query.employeeId || query.id) 
    : user.employeeId;

  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;
  const startDate = query.startDate;
  const endDate = query.endDate;

  try {
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (targetEmployeeId) {
      whereClauses.push('dtr.employee_id = ?');
      params.push(targetEmployeeId);
    }

    if (startDate && endDate) {
      whereClauses.push('dtr.date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryStr = `
      SELECT dtr.*, a.first_name, a.last_name, a.department 
      FROM daily_time_records dtr
      LEFT JOIN authentication a ON dtr.employee_id = a.employee_id
      ${whereString}
      ORDER BY dtr.date DESC 
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM daily_time_records dtr
      ${whereString}
    `;

    const [logs] = await db.query<DTRRow[]>(queryStr, [...params, limit, offset]);
    const [countResult] = await db.query<CountRow[]>(countQuery, params);
    const total = countResult[0].total;

    const formattedLogs = logs.map((log) => ({
      ...log,
      department: log.department || 'N/A',
      employee_name: (log.first_name && log.last_name) 
        ? `${log.first_name} ${log.last_name}` 
        : 'Unknown Employee'
    }));

    res.status(200).json({
      success: true,
      message: formattedLogs.length > 0 ? 'Logs retrieved successfully.' : 'No logs found.',
      data: formattedLogs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    handleError(res, err as Error, 'getLogs');
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const [logs] = await db.query<DTRRow[]>(`
      SELECT dtr.*, a.first_name, a.last_name, a.department 
      FROM daily_time_records dtr
      LEFT JOIN authentication a ON dtr.employee_id = a.employee_id
      ORDER BY dtr.updated_at DESC LIMIT 20
    `);

    const formattedLogs = logs.map((log) => ({
      ...log,
      name: (log.first_name && log.last_name) 
        ? `${log.first_name} ${log.last_name}` 
        : 'Unknown Employee',
      department: log.department || 'N/A'
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, 'getRecentActivity');
  }
};

export const getTodayStatus = async (req: Request, res: Response): Promise<void> => {
  const validation = GetTodayStatusSchema.safeParse(req);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters.',
      errors: validation.error.format()
    });
    return;
  }

  const { query } = validation.data;
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const isAdminOrHr = ['admin', 'hr'].includes(user.role?.toLowerCase());

  let employeeId = query.employeeId;

  if (!isAdminOrHr || !employeeId) {
    employeeId = user.employeeId;
  }

  if (!employeeId) {
    res.status(400).json({ success: false, message: 'Employee ID is required.', data: null });
    return;
  }

  try {
    const date = getLocalDate();
    const [dtr] = await db.query<DTRRow[]>(
      'SELECT status, time_in, time_out FROM daily_time_records WHERE employee_id = ? AND date = ?',
      [employeeId, date]
    );

    if (dtr.length > 0) {
      res.status(200).json({
        success: true,
        message: "Today's status retrieved successfully.",
        data: { status: dtr[0].status, timeIn: dtr[0].time_in, timeOut: dtr[0].time_out }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Not clocked in today.',
        data: { status: 'Absent', timeIn: null, timeOut: null }
      });
    }
  } catch (err) {
    handleError(res, err as Error, 'getTodayStatus');
  }
};

export const getRawLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const [logs] = await db.query<AttendanceLogRow[]>(`
      SELECT al.*, a.first_name, a.last_name, a.department
      FROM attendance_logs al
      LEFT JOIN authentication a ON al.employee_id = a.employee_id
      ORDER BY al.scan_time DESC
      LIMIT 500
    `);

    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    handleError(res, err as Error, 'getRawLogs');
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const todayStr = getLocalDate();
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];

    const [allEmployees] = await db.query<EmployeeWithSchedule[]>(`
      SELECT a.employee_id, a.first_name, a.last_name, a.department, a.job_title, a.date_hired, a.employment_status,
             s.is_rest_day, s.start_time, s.end_time
      FROM authentication a
      LEFT JOIN schedules s ON a.employee_id = s.employee_id AND s.day_of_week = ?
      WHERE a.role != 'admin'
      ORDER BY a.date_hired DESC
    `, [dayName]);

    const [dtrRecords] = await db.query<DTRRow[]>(`
      SELECT dtr.*, a.first_name, a.last_name, a.department
      FROM daily_time_records dtr
      JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE DATE(dtr.date) = ?
    `, [todayStr]);

    const [leaves] = await db.query<LeaveRow[]>(`
      SELECT lr.*, a.first_name, a.last_name, a.department
      FROM leave_requests lr
      JOIN authentication a ON lr.employee_id = a.employee_id
      WHERE lr.status = 'Approved' 
      AND DATE(?) >= DATE(lr.start_date) 
      AND DATE(?) <= DATE(lr.end_date)
    `, [todayStr, todayStr]);

    const dtrMap = new Map(dtrRecords.map((r) => [r.employee_id, r]));
    const onLeaveEmployeeIds = new Set(leaves.map((l) => l.employee_id));

    interface StatusRecord {
      id: string;
      name: string;
      department: string;
      status?: string;
      timeIn?: string;
      timeOut?: string;
      date?: string;
      minutesLate?: number;
      reason?: string;
      position?: string;
      hireDate?: string;
    }

    const presentList: StatusRecord[] = [];
    const lateList: StatusRecord[] = [];
    const absentList: StatusRecord[] = [];
    const hiredList: StatusRecord[] = [];

    allEmployees.forEach((emp) => {
      const employeeId = emp.employee_id;
      const name = `${emp.first_name} ${emp.last_name}`;

      hiredList.push({
        id: employeeId,
        name,
        department: emp.department || '-',
        position: emp.job_title || '-',
        status: emp.employment_status || 'Active',
        hireDate: formatDate(emp.date_hired)
      });

      if (onLeaveEmployeeIds.has(employeeId)) return;

      const dtr = dtrMap.get(employeeId);

      if (dtr) {
        const record: StatusRecord = {
          id: employeeId,
          name,
          department: emp.department || '-',
          status: dtr.status,
          timeIn: formatTime(dtr.time_in),
          timeOut: formatTime(dtr.time_out),
          date: todayStr,
          minutesLate: dtr.late_minutes || 0
        };

        if (dtr.status === 'Late') {
          lateList.push(record);
          presentList.push(record);
        } else if (dtr.status === 'Present') {
          presentList.push(record);
        }
      } else {
        if (emp.is_rest_day === 0) {
          absentList.push({
            id: employeeId,
            name,
            department: emp.department || '-',
            status: 'Absent',
            reason: 'No clock-in recorded',
            date: todayStr
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        counts: {
          present: presentList.length,
          late: lateList.length,
          absent: absentList.length,
          onLeave: leaves.length,
          hired: allEmployees.length
        },
        lists: {
          present: presentList,
          absent: absentList,
          late: lateList,
          hired: hiredList,
          onLeave: leaves.map((l) => ({
            id: l.employee_id,
            name: `${l.first_name} ${l.last_name}`,
            department: l.department || '-',
            leaveType: l.leave_type,
            startDate: l.start_date,
            endDate: l.end_date
          }))
        }
      }
    });
  } catch (err) {
    handleError(res, err as Error, 'getDashboardStats');
  }
};
