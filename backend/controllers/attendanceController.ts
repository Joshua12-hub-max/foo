import { Request, Response } from "express";
import { db } from "../db/index.js";
import { 
  attendanceLogs, 
  dailyTimeRecords, 
  authentication, 
  schedules, 
  leaveApplications, // Updated from leaveRequests
  recruitmentApplicants, 
  recruitmentJobs 
} from "../db/schema.js";
import { eq, and, sql, desc, between, ne } from "drizzle-orm";
import { processDailyAttendance } from "../services/attendanceProcessor.js";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  GetLogsSchema,
  GetTodayStatusSchema,
} from "../schemas/attendanceSchema.js";

// ============================================================================
// Helpers
// ============================================================================

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

// ============================================================================
// Controllers
// ============================================================================

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const employeeId = authReq.user.employeeId;

  if (!employeeId) {
    res.status(400).json({
      success: false,
      message: "User not authenticated or missing Employee ID.",
      data: null,
    });
    return;
  }

  try {
    const scanTime = new Date();
    await db.insert(attendanceLogs).values({
      employeeId,
      scanTime: scanTime.toISOString(),
      type: 'IN',
      source: 'WEB'
    });

    res.status(201).json({
      success: true,
      message: "Clock in successful.",
      data: { timeIn: scanTime },
    });
  } catch (err) {
    handleError(res, err as Error, "clockIn");
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const employeeId = authReq.user.employeeId;

  if (!employeeId) {
    res.status(400).json({
      success: false,
      message: "User not authenticated or missing Employee ID.",
      data: null,
    });
    return;
  }

  try {
    const scanTime = new Date();
    const dateStr = getLocalDate();

    await db.insert(attendanceLogs).values({
      employeeId,
      scanTime: scanTime.toISOString(),
      type: 'OUT',
      source: 'WEB'
    });

    await processDailyAttendance(employeeId, dateStr);

    res.status(200).json({
      success: true,
      message: "Clock out successful.",
      data: { timeOut: scanTime },
    });
  } catch (err) {
    handleError(res, err as Error, "clockOut");
  }
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

  const targetEmployeeId = isAdminOrHr
    ? query.employeeId || query.id
    : user.employeeId;

  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;
  const startDate = query.startDate;
  const endDate = query.endDate;

  try {
    const whereConditions = [];
    if (targetEmployeeId) {
      whereConditions.push(eq(dailyTimeRecords.employeeId, targetEmployeeId));
    }
    if (startDate && endDate) {
      whereConditions.push(between(dailyTimeRecords.date, startDate, endDate));
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
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      department: authentication.department
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
    .where(whereClause);

    const total = Number(countResult.total || 0);

    const formattedLogs = logs.map((log) => ({
      ...log,
      department: log.department || "N/A",
      employee_name: log.first_name && log.last_name
          ? `${log.first_name} ${log.last_name}`
          : "Unknown Employee",
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

    const formattedLogs = logs.map((log) => ({
      ...log,
      name: log.firstName && log.lastName
          ? `${log.firstName} ${log.lastName}`
          : "Unknown Employee",
      department: log.department || "N/A",
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

export const getRawLogs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db.select({
      id: attendanceLogs.id,
      employee_id: attendanceLogs.employeeId,
      scan_time: attendanceLogs.scanTime,
      type: attendanceLogs.type,
      source: attendanceLogs.source,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      department: authentication.department
    })
    .from(attendanceLogs)
    .leftJoin(authentication, eq(attendanceLogs.employeeId, authentication.employeeId))
    .orderBy(desc(attendanceLogs.scanTime))
    .limit(500);

    res.status(200).json({ success: true, data: logs });
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
      isRestDay: schedules.isRestDay,
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
      firstName: recruitmentApplicants.firstName,
      lastName: recruitmentApplicants.lastName,
      email: recruitmentApplicants.email,
      createdAt: recruitmentApplicants.createdAt,
      hiredDate: recruitmentApplicants.hiredDate,
      jobTitle: recruitmentJobs.title,
      departmentName: recruitmentJobs.department
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .where(eq(recruitmentApplicants.stage, 'Hired'))
    .orderBy(desc(recruitmentApplicants.hiredDate), desc(recruitmentApplicants.createdAt));

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
        if (emp.isRestDay === 0) {
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
