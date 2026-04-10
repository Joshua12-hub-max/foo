import { Request, Response } from "express";
import { db } from "../db/index.js";
import { 
  attendanceLogs, 
  dailyTimeRecords, 
  authentication, 
  bioEnrolledUsers,
  departments,
  pdsHrDetails
} from "../db/schema.js";
import { eq, and, sql, desc, between, or, like, inArray } from "drizzle-orm";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  GetLogsSchema,
} from "../schemas/attendanceSchema.js";
import { DTRApiResponse } from "../types/attendance.js";
import { formatToManilaDateTime, currentManilaDateTime } from "../utils/dateUtils.js";
import { compareIds } from "../utils/idUtils.js";
import { processDailyAttendance } from "../services/attendanceProcessor.js";

/**
 * Standard Error Handler
 */
const handleError = (res: Response, error: Error, context: string): void => {
  console.error(`[ATTENDANCE_CONTROLLER] Error in ${context}:`, error.message);
  res.status(500).json({
    success: false,
    message: `An unexpected error occurred in ${context}.`,
    error: error.message
  });
};

/**
 * Get Local Manila Date (YYYY-MM-DD)
 */
const getLocalDate = (): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

/**
 * Helper to enforce Normal Case (Title Case)
 */
const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return "";
  return str.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
};

/**
 * GET /logs
 * Fully Fixed & Accurate Filter Logic with Target-First Expansion.
 */
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const rawQuery = req.query;

    const validation = GetLogsSchema.safeParse({ query: rawQuery });
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Invalid query parameters." });
      return;
    }

    const { page, limit, startDate, endDate, department, employeeId: queryEmployeeId, search } = validation.data.query;
    const isAdminOrHr = ['Administrator', 'Human Resource'].includes(user.role);
    
    // 1. Determine Target Employees (ID Isolation)
    // We use distinct() to prevent join multipliers if an employee has multiple HR records (though they shouldn't)
    const employeeQuery = db.selectDistinct({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, authentication.employeeId));

    const empConditions = [];
    
    if (!isAdminOrHr) {
      empConditions.push(compareIds(authentication.employeeId, user.employeeId));
    } else {
      if (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '') {
        empConditions.push(compareIds(authentication.employeeId, queryEmployeeId));
      }
      if (department && department !== 'all' && department !== 'All Departments' && department !== '') {
        empConditions.push(sql`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A') = ${department}`);
      }
      if (search && search !== '') {
        const s = `%${search}%`;
        empConditions.push(or(
          like(authentication.firstName, s),
          like(authentication.lastName, s),
          like(authentication.employeeId, s)
        ));
      }
    }

    const targetEmployees = await employeeQuery.where(empConditions.length > 0 ? and(...empConditions) : undefined);

    if (targetEmployees.length === 0) {
      res.status(200).json({ success: true, data: [], totals: { lateMinutes: 0, undertimeMinutes: 0, hoursWorked: "0.00" }, pagination: { total: 0, page, limit, totalPages: 0 } });
      return;
    }

    // 2. Define Date Range
    const start = (startDate && startDate !== '') ? new Date(startDate) : new Date();
    const end = (endDate && endDate !== '') ? new Date(endDate) : new Date();
    if (!startDate || startDate === '') {
      start.setDate(1); // Default to current month start
    }

    const dates: string[] = [];
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    // 3. Get existing DTRs for these employees and dates
    // 100% TYPE SAFETY: Filter out nulls and ensure arrays are not empty to prevent SQL 'IN ()' errors
    const empIds = targetEmployees.map(e => e.employeeId).filter((id): id is string => !!id);
    
    let existingDtrs: any[] = [];
    if (empIds.length > 0 && dates.length > 0) {
      existingDtrs = await db.select().from(dailyTimeRecords).where(and(
        inArray(dailyTimeRecords.employeeId, empIds),
        inArray(dailyTimeRecords.date, dates)
      ));
    }

    const dtrMap = new Map<string, typeof existingDtrs[0]>();
    let totalLate = 0;
    let totalUndertime = 0;
    let totalSecondsWorked = 0;

    existingDtrs.forEach(d => {
      dtrMap.set(`${d.employeeId}:${d.date}`, d);
      totalLate += (d.lateMinutes || 0);
      totalUndertime += (d.undertimeMinutes || 0);
      if (d.timeIn && d.timeOut) {
          const diff = (new Date(d.timeOut).getTime() - new Date(d.timeIn).getTime()) / 1000;
          // Apply 1 hour break policy if worked > 5 hours
          totalSecondsWorked += (diff > 18000 ? diff - 3600 : diff);
      }
    });

    // 4. Construct Full Attendance List
    const fullList: DTRApiResponse[] = [];
    const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));
    
    // 100% PRECISION: Smart Expansion
    // If viewing a SPECIFIC employee, we show ALL dates (including absents) for their DTR.
    // If viewing ALL employees or a DEPARTMENT, we ONLY show rows that physically exist in the database
    // to prevent the "Too Many Absent" clutter reported by the user.
    const isSingleEmployee = queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '';

    for (const date of sortedDates) {
      for (const emp of targetEmployees) {
        const dtr = dtrMap.get(`${emp.employeeId}:${date}`);
        
        // Skip expansion if it's not a single-employee view and no record exists
        if (!isSingleEmployee && !dtr) continue;

        const fullName = `${toTitleCase(emp.lastName)}, ${toTitleCase(emp.firstName)}${emp.middleName ? ' ' + toTitleCase(emp.middleName) : ''}`;

        fullList.push({
          id: dtr?.id || 0,
          employeeId: emp.employeeId || '',
          date: date,
          timeIn: dtr?.timeIn ? formatToManilaDateTime(dtr.timeIn) : null,
          timeOut: dtr?.timeOut ? formatToManilaDateTime(dtr.timeOut) : null,
          lateMinutes: dtr?.lateMinutes || 0,
          undertimeMinutes: dtr?.undertimeMinutes || 0,
          overtimeMinutes: dtr?.overtimeMinutes || 0,
          status: dtr?.status || 'Absent',
          createdAt: dtr?.createdAt || null,
          updatedAt: dtr?.updatedAt || null,
          employeeName: fullName,
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          middleName: emp.middleName || null,
          suffix: emp.suffix || null,
          department: emp.department || 'N/A',
          duties: 'Standard Shift',
          shift: '08:00 AM - 05:00 PM',
          dutyType: 'Standard'
        });
      }
    }

    // 5. Pagination
    const total = fullList.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedList = fullList.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      message: "Logs retrieved successfully.",
      data: paginatedList,
      totals: {
        lateMinutes: totalLate,
        undertimeMinutes: totalUndertime,
        hoursWorked: (totalSecondsWorked / 3600).toFixed(2)
      },
      pagination: { total, page, limit, totalPages }
    });
  } catch (err) {
    handleError(res, err as Error, "getLogs");
  }
};

/**
 * GET /recent-activity
 */
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
      bioFullName: bioEnrolledUsers.fullName
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
    .orderBy(desc(dailyTimeRecords.updatedAt))
    .limit(20);

    const formattedLogs = logs.map(log => ({
      ...log,
      employeeName: log.firstName && log.lastName ? `${toTitleCase(log.lastName)}, ${toTitleCase(log.firstName)}` : (log.bioFullName || "Unknown"),
      timeIn: log.timeIn ? formatToManilaDateTime(log.timeIn) : null,
      timeOut: log.timeOut ? formatToManilaDateTime(log.timeOut) : null,
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, "getRecentActivity");
  }
};

/**
 * GET /today-status
 */
export const getTodayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = req.query.employeeId as string || authReq.user.employeeId;
    const today = getLocalDate();

    const dtr = await db.query.dailyTimeRecords.findFirst({
      where: and(
        eq(dailyTimeRecords.employeeId, employeeId),
        eq(dailyTimeRecords.date, today)
      )
    });

    res.status(200).json({
      success: true,
      data: dtr ? { status: dtr.status, timeIn: dtr.timeIn, timeOut: dtr.timeOut } : { status: "Absent", timeIn: null, timeOut: null }
    });
  } catch (err) {
    handleError(res, err as Error, "getTodayStatus");
  }
};

/**
 * POST /clock-in
 */
export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId;
    const todayStr = getLocalDate();
    const nowStr = currentManilaDateTime();

    const existing = await db.select().from(attendanceLogs).where(and(
      compareIds(attendanceLogs.employeeId, employeeId),
      eq(attendanceLogs.type, 'IN'),
      sql`DATE(${attendanceLogs.scanTime}) = ${todayStr}`
    )).limit(1);

    if (existing.length > 0) {
      res.status(400).json({ success: false, message: "Already clocked in today." });
      return;
    }

    await db.insert(attendanceLogs).values({
      employeeId,
      scanTime: nowStr,
      type: 'IN',
      source: 'Manual Widget'
    });

    await processDailyAttendance(employeeId, todayStr);
    res.status(200).json({ success: true, message: "Clocked in successfully." });
  } catch (err) {
    handleError(res, err as Error, "clockIn");
  }
};

/**
 * POST /clock-out
 */
export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId;
    const todayStr = getLocalDate();
    const nowStr = currentManilaDateTime();

    await db.insert(attendanceLogs).values({
      employeeId,
      scanTime: nowStr,
      type: 'OUT',
      source: 'Manual Widget'
    });

    await processDailyAttendance(employeeId, todayStr);
    res.status(200).json({ success: true, message: "Clocked out successfully." });
  } catch (err) {
    handleError(res, err as Error, "clockOut");
  }
};

/**
 * GET /raw-logs
 */
export const getRawLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, startDate, endDate, limit = 500 } = req.query;
    const whereConditions = [];

    if (employeeId && employeeId !== 'all') {
      whereConditions.push(compareIds(attendanceLogs.employeeId, String(employeeId)));
    }
    if (startDate && endDate) {
      whereConditions.push(between(attendanceLogs.scanTime, `${startDate} 00:00:00`, `${endDate} 23:59:59`));
    }

    const logs = await db.select({
      id: attendanceLogs.id,
      employeeId: attendanceLogs.employeeId,
      scanTime: attendanceLogs.scanTime,
      type: attendanceLogs.type,
      source: attendanceLogs.source,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      bioFullName: bioEnrolledUsers.fullName
    })
    .from(attendanceLogs)
    .leftJoin(authentication, compareIds(attendanceLogs.employeeId, authentication.employeeId))
    .leftJoin(bioEnrolledUsers, compareIds(attendanceLogs.employeeId, bioEnrolledUsers.employeeId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(attendanceLogs.scanTime))
    .limit(Number(limit));

    const formattedLogs = logs.map(log => ({
      ...log,
      employeeName: log.firstName && log.lastName ? `${toTitleCase(log.lastName)}, ${toTitleCase(log.firstName)}` : (log.bioFullName || "Unknown Employee")
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, "getRawLogs");
  }
};

/**
 * GET /dashboard-stats
 */
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = getLocalDate();
    
    // Fetch DTRs with Names
    const dtrs = await db.select({
      id: dailyTimeRecords.id,
      employeeId: dailyTimeRecords.employeeId,
      status: dailyTimeRecords.status,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: sql<string>`COALESCE(${departments.name}, 'N/A')`
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(eq(dailyTimeRecords.date, today));
    
    const presentList = dtrs.filter(d => d.status && ['Present', 'Present (Late)', 'Late', 'Undertime', 'Late/Undertime'].includes(d.status));
    const lateList = dtrs.filter(d => d.status && ['Late', 'Present (Late)', 'Late/Undertime'].includes(d.status));
    
    const counts = {
      present: presentList.length,
      late: lateList.length,
      absent: 0,
      onLeave: 0,
      hired: 0
    };

    const lists = {
      present: presentList.map(d => ({ ...d, name: `${d.lastName}, ${d.firstName}` })),
      late: lateList.map(d => ({ ...d, name: `${d.lastName}, ${d.firstName}` })),
      absent: [],
      onLeave: [],
      hired: []
    };

    res.status(200).json({ success: true, data: { counts, lists } });
  } catch (err) {
    handleError(res, err as Error, "getDashboardStats");
  }
};
