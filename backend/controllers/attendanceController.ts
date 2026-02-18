import { Request, Response } from "express";
import { db } from "../db/index.js";
import { 
  attendanceLogs, 
  dailyTimeRecords, 
  authentication, 
  schedules, 
  leaveApplications, 
  recruitmentApplicants, 
  recruitmentJobs,
  bioEnrolledUsers 
} from "../db/schema.js";
import { eq, and, sql, desc, between, ne, or, like } from "drizzle-orm";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  GetLogsSchema,
  GetTodayStatusSchema,
} from "../schemas/attendanceSchema.js";
import { AttendanceLogApiResponse, DTRApiResponse } from "../types/attendance.js";
import { formatToManilaDateTime } from "../utils/dateUtils.js";


const handleError = (res: Response, error: Error, context: string): void => {
  console.error(`Error in ${context}:`, error);
  res.status(500).json({
    success: false,
    message: `An unexpected error occurred in ${context}.`,
    data: null,
  });
};

const getLocalDate = (): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const formatTime = (dateTime: string | null | undefined): string => {
  if (!dateTime) return "-";
  const date = new Date(dateTime);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const mapToAttendanceLogApi = (log: any): AttendanceLogApiResponse => {
  return {
    id: log.id,
    employee_id: log.employee_id || log.employeeId, 
    scan_time: log.scan_time ? new Date(log.scan_time).toISOString() : (log.scanTime ? new Date(log.scanTime).toISOString() : ''),
    type: (log.type || 'IN') as 'IN' | 'OUT',
    source: log.source || 'Unknown',
    first_name: log.first_name || log.firstName || null,
    last_name: log.last_name || log.lastName || null,
    department: log.department || 'N/A',
    duties: log.duties || 'No Schedule',
    dtr_status: log.dtr_status || 'Present'
  };
};



export const getLogs = async (req: Request, res: Response): Promise<void> => {
  const validation = GetLogsSchema.safeParse(req);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters.",
      errors: validation.error.format(),
    });
    return;
  }

  const { query } = validation.data;
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const isAdminOrHr = ["admin", "hr"].includes(user.role?.toLowerCase());

  // Extract query parameters
  const { 
    startDate, 
    endDate, 
    department, 
    search, 
    employeeId: queryEmployeeId, 
    id: queryId,
    page: qPage = 1,
    limit: qLimit = 10 
  } = query;

  // Determine which employee's logs to fetch
  const targetEmployeeId = isAdminOrHr
    ? queryEmployeeId || queryId
    : user.employeeId;

  const page = qPage;
  const limit = qLimit;
  const offset = (page - 1) * limit;

  try {
    const whereConditions = [];
    if (targetEmployeeId) {
      whereConditions.push(eq(dailyTimeRecords.employeeId, targetEmployeeId));
    }
    if (startDate && endDate) {
      // Robust date parsing (Handle MM/DD/YYYY or YYYY-MM-DD)
      const parseDate = (dateStr: string) => {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return dateStr; // Fallback to original if invalid
          return d.toISOString().split('T')[0];
      };
      
      const safeStartDate = parseDate(startDate);
      const safeEndDate = parseDate(endDate);

      whereConditions.push(between(dailyTimeRecords.date, safeStartDate, safeEndDate));
    }
    if (department && department !== 'all') {
      whereConditions.push(eq(authentication.department, department));
    }
    if (search) {
      const searchStr = `%${search}%`;
      whereConditions.push(or(
        like(authentication.firstName, searchStr),
        like(authentication.lastName, searchStr),
        like(authentication.employeeId, searchStr),
        like(dailyTimeRecords.employeeId, searchStr)
      ));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const logs = await db.select({
      id: dailyTimeRecords.id,
      employeeId: dailyTimeRecords.employeeId,
      date: dailyTimeRecords.date,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      lateMinutes: dailyTimeRecords.lateMinutes,
      undertimeMinutes: dailyTimeRecords.undertimeMinutes,
      overtimeMinutes: dailyTimeRecords.overtimeMinutes,
      status: dailyTimeRecords.status,
      createdAt: dailyTimeRecords.createdAt,
      updatedAt: dailyTimeRecords.updatedAt,
      employee_name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
      department: authentication.department,
      duties: sql<string>`(SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} ORDER BY updated_at DESC LIMIT 1)`
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
    .where(whereClause)
    .orderBy(desc(dailyTimeRecords.date))
    .limit(limit)
    .offset(offset);

    const [countResult] = await db.select({
      total: sql<number>`count(*)`
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
    .where(whereClause);

    const total = Number(countResult.total || 0);

    const formattedLogs: DTRApiResponse[] = logs.map((log) => ({
      id: log.id,
      employee_id: log.employeeId,
      date: log.date ? new Date(log.date).toISOString().split('T')[0] : '',
      time_in: log.timeIn ? formatToManilaDateTime(log.timeIn) : null,
      time_out: log.timeOut ? formatToManilaDateTime(log.timeOut) : null,
      late_minutes: log.lateMinutes || 0,
      undertime_minutes: log.undertimeMinutes || 0,
      overtime_minutes: log.overtimeMinutes || 0,
      status: log.status || 'Pending',
      created_at: log.createdAt ? new Date(log.createdAt).toISOString() : null,
      updated_at: log.updatedAt ? new Date(log.updatedAt).toISOString() : null,
      employee_name: log.employee_name || "Unknown Employee",
      department: log.department || "N/A",
      duties: log.duties || 'No Schedule'
    }));

    res.status(200).json({
      success: true,
      message: formattedLogs.length > 0 ? "Logs retrieved successfully." : "No logs found.",
      data: formattedLogs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    handleError(res, err as Error, "getLogs");
  }
};

export const getRecentActivity = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db.select({
      id: dailyTimeRecords.id,
      employeeId: dailyTimeRecords.employeeId,
      date: dailyTimeRecords.date,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      status: dailyTimeRecords.status,
      updatedAt: dailyTimeRecords.updatedAt,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: authentication.department
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
    .orderBy(desc(dailyTimeRecords.updatedAt))
    .limit(20);

    const formattedLogs: DTRApiResponse[] = logs.map((log) => ({
      id: log.id,
      employee_id: log.employeeId,
      date: log.date ? new Date(log.date).toLocaleDateString('en-US') : '',
      time_in: log.timeIn ? formatToManilaDateTime(log.timeIn) : null,
      time_out: log.timeOut ? formatToManilaDateTime(log.timeOut) : null,
      late_minutes: 0, // Recent activity doesn't usually feature this, but interface requires it
      undertime_minutes: 0,
      overtime_minutes: 0,
      status: log.status || 'Pending',
      created_at: null,
      updated_at: log.updatedAt || null,
      employee_name: (log.firstName && log.lastName) ? `${log.firstName} ${log.lastName}` : "Unknown Employee",
      department: log.department || "N/A",
      duties: 'No Schedule' // Recent activity doesn't fetch schedule
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, "getRecentActivity");
  }
};

export const getTodayStatus = async (req: Request, res: Response): Promise<void> => {
  const validation = GetTodayStatusSchema.safeParse(req);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid query parameters.",
      errors: validation.error.format(),
    });
    return;
  }

  const { query } = validation.data;
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const isAdminOrHr = ["admin", "hr"].includes(user.role?.toLowerCase());

  let employeeId = query.employeeId;
  if (!isAdminOrHr || !employeeId) {
    employeeId = user.employeeId;
  }

  if (!employeeId) {
    res.status(400).json({
      success: false,
      message: "Employee ID is required.",
      data: null,
    });
    return;
  }

  try {
    const today = getLocalDate();
    const dtr = await db.query.dailyTimeRecords.findFirst({
      where: and(
        eq(dailyTimeRecords.employeeId, employeeId),
        eq(dailyTimeRecords.date, today)
      ),
      columns: { status: true, timeIn: true, timeOut: true }
    });

    if (dtr) {
      res.status(200).json({
        success: true,
        message: "Today's status retrieved successfully.",
        data: {
          status: dtr.status,
          timeIn: dtr.timeIn,
          timeOut: dtr.timeOut,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Not clocked in today.",
        data: { status: "Absent", timeIn: null, timeOut: null },
      });
    }
  } catch (err) {
    handleError(res, err as Error, "getTodayStatus");
  }
};

export const getRawLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, startDate, endDate, department, search, limit = 500 } = req.query;

    const whereConditions = [];

    if (employeeId) {
      whereConditions.push(eq(attendanceLogs.employeeId, String(employeeId)));
    }

    if (startDate && endDate) {
       whereConditions.push(between(attendanceLogs.scanTime, `${startDate} 00:00:00`, `${endDate} 23:59:59`));
    }

    if (department && department !== 'All Departments') {
       whereConditions.push(
         sql`COALESCE(${authentication.department}, ${bioEnrolledUsers.department}) = ${String(department)}`
       );
    }

    if (search) {
      const searchStr = `%${search}%`;
      whereConditions.push(or(
        like(authentication.firstName, searchStr),
        like(authentication.lastName, searchStr),
        like(bioEnrolledUsers.fullName, searchStr),
        like(attendanceLogs.employeeId, searchStr)
      ));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const logs = await db.select({
      id: attendanceLogs.id,
      employee_id: attendanceLogs.employeeId,
      scan_time: attendanceLogs.scanTime,
      type: attendanceLogs.type,
      source: attendanceLogs.source,
      // COALESCE: try authentication first, fallback to bio_enrolled_users
      first_name: sql<string>`COALESCE(
        ${authentication.firstName},
        SUBSTRING_INDEX(${bioEnrolledUsers.fullName}, ' ', 1)
      )`,
      last_name: sql<string>`COALESCE(
        ${authentication.lastName},
        CASE WHEN LOCATE(' ', ${bioEnrolledUsers.fullName}) > 0
          THEN SUBSTRING(${bioEnrolledUsers.fullName}, LOCATE(' ', ${bioEnrolledUsers.fullName}) + 1)
          ELSE ''
        END
      )`,
      department: sql<string>`COALESCE(${authentication.department}, ${bioEnrolledUsers.department}, 'N/A')`,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${attendanceLogs.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`,
      dtr_status: sql<string>`COALESCE((SELECT status FROM daily_time_records WHERE employee_id = ${attendanceLogs.employeeId} AND date = DATE(${attendanceLogs.scanTime}) LIMIT 1), 'Present')`
    })
    .from(attendanceLogs)
    .leftJoin(authentication, eq(attendanceLogs.employeeId, authentication.employeeId))
    .leftJoin(bioEnrolledUsers, sql`${bioEnrolledUsers.employeeId} = CAST(REPLACE(${attendanceLogs.employeeId}, 'EMP-', '') AS UNSIGNED)`)
    .where(whereClause)
    .orderBy(desc(attendanceLogs.scanTime))
    .limit(Number(limit));

    const formattedLogs = logs.map(mapToAttendanceLogApi);

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, "getRawLogs");
  }
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const todayStr = getLocalDate();
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[now.getDay()];

    const allEmployees = await db.select({
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: authentication.department,
      jobTitle: authentication.jobTitle,
      dateHired: authentication.dateHired,
      employmentStatus: authentication.employmentStatus,
      startTime: schedules.startTime,
      endTime: schedules.endTime
    })
    .from(authentication)
    .leftJoin(schedules, and(
      eq(authentication.employeeId, schedules.employeeId),
      eq(schedules.dayOfWeek, dayName)
    ))
    .where(ne(authentication.role, 'admin'))
    .orderBy(desc(authentication.dateHired));

    const dtrRecords = await db.select({
      employeeId: dailyTimeRecords.employeeId,
      status: dailyTimeRecords.status,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      lateMinutes: dailyTimeRecords.lateMinutes,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: authentication.department
    })
    .from(dailyTimeRecords)
    .innerJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
    .where(eq(dailyTimeRecords.date, todayStr));

    const leaves = await db.select({
      employeeId: leaveApplications.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: authentication.department,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate
    })
    .from(leaveApplications)
    .innerJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .where(and(
      eq(leaveApplications.status, 'Approved'),
      sql`DATE(${todayStr}) >= DATE(${leaveApplications.startDate})`,
      sql`DATE(${todayStr}) <= DATE(${leaveApplications.endDate})`
    ));

    const hiredApplicants = await db.select({
      id: recruitmentApplicants.id,
      firstName: recruitmentApplicants.first_name,
      lastName: recruitmentApplicants.last_name,
      email: recruitmentApplicants.email,
      createdAt: recruitmentApplicants.created_at,
      hiredDate: recruitmentApplicants.hired_date,
      jobTitle: recruitmentJobs.title,
      departmentName: recruitmentJobs.department
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.job_id, recruitmentJobs.id))
    .where(eq(recruitmentApplicants.stage, 'Hired'))
    .orderBy(desc(recruitmentApplicants.hired_date), desc(recruitmentApplicants.created_at));

    const dtrMap = new Map(dtrRecords.map((r) => [r.employeeId, r]));
    const onLeaveEmployeeIds = new Set(leaves.map((l) => l.employeeId));

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

    allEmployees.forEach((emp) => {
      const employeeId = emp.employeeId;
      const name = `${emp.firstName} ${emp.lastName}`;

      if (onLeaveEmployeeIds.has(employeeId)) return;

      const dtr = dtrMap.get(employeeId);

      if (dtr) {
        const record: StatusRecord = {
          id: employeeId,
          name,
          department: emp.department || "-",
          status: dtr.status || "Present",
          timeIn: formatTime(dtr.timeIn),
          timeOut: formatTime(dtr.timeOut),
          date: todayStr,
          minutesLate: dtr.lateMinutes || 0,
        };

        if (dtr.status === "Late") {
          lateList.push(record);
          presentList.push(record);
        } else if (dtr.status === "Present") {
          presentList.push(record);
        }
      } else {
        // If they have a schedule but no DTR, they are absent
        if (emp.startTime) {
          absentList.push({
            id: employeeId,
            name,
            department: emp.department || "-",
            status: "Absent",
            reason: "No clock-in recorded",
            date: todayStr,
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
          hired: hiredApplicants.length,
        },
        lists: {
          present: presentList,
          absent: absentList,
          late: lateList,
          hired: hiredApplicants.map((a) => ({
            id: `EMP-${a.id}`,
            name: `${a.firstName} ${a.lastName}`,
            department: a.departmentName || "-",
            position: a.jobTitle || "-",
            date_hired: formatDate(a.hiredDate || a.createdAt),
          })),
          onLeave: leaves.map((l) => ({
            id: l.employeeId,
            name: `${l.firstName} ${l.lastName}`,
            department: l.department || "-",
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
          })),
        },
      },
    });
  } catch (err) {
    handleError(res, err as Error, "getDashboardStats");
  }
};
