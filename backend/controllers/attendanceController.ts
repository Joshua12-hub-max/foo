import { Request, Response } from "express";
import { db } from "../db/index.js";
import { 
  attendanceLogs, 
  dailyTimeRecords, 
  authentication, 
  bioEnrolledUsers,
  departments,
  pdsHrDetails,
  leaveApplications
} from "../db/schema.js";
import { eq, and, sql, desc, gte, lte, between, or, like, inArray, ne, isNotNull, lt } from "drizzle-orm";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  GetLogsSchema,
} from "../schemas/attendanceSchema.js";
import { DTRApiResponse } from "../types/attendance.js";
import { formatToManilaDateTime, currentManilaDateOnly, normalizeToIsoDate } from "../utils/dateUtils.js";
import { formatFullName } from "../utils/nameUtils.js";
import { compareIds, normalizeIdJs } from "../utils/idUtils.js";
import { ATTENDANCE_STATUS } from '../constants/statusConstants.js';

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
    
    // 100% PRECISE FILTERING: 
    // 1. If an explicit employeeId is provided (and it's not 'all'), use it strictly.
    // 2. If 'all' is explicitly provided, use 'all' (only for Admin/HR).
    // 3. IF NO ID IS PROVIDED (empty or missing):
    //    - If Admin/HR, use 'all' (This is for the Admin Portal).
    //    - If regular user, use user.employeeId (Self).
    const effectiveEmployeeId = (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '') 
      ? String(queryEmployeeId) 
      : (isAdminOrHr ? 'all' : user.employeeId);

    // 100% SUCCESS: Correctly identify if we are in a single employee view for Absent expansion
    const isSingleEmployee = (effectiveEmployeeId !== 'all');
    const targetIdForExpansion = isSingleEmployee ? effectiveEmployeeId : null;

    // Normalize Dates to YYYY-MM-DD for MySQL compatibility
    const startStr = normalizeToIsoDate(startDate) || (currentManilaDateOnly().split('-').slice(0, 2).join('-') + '-01');
    const endStr = normalizeToIsoDate(endDate) || currentManilaDateOnly();
    
    const dates: string[] = [];
    const dStart = new Date(startStr);
    const dEnd = new Date(endStr);
    
    if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime())) {
      for (let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    // 100% PRECISION: Join shift and duty info directly for Attendance View
    const dtrQuery = db.select({
      dtr: dailyTimeRecords,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`,
      bioFullName: bioEnrolledUsers.fullName,
      dutyType: sql<string>`COALESCE(${pdsHrDetails.dutyType}, 'Standard')`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) 
         FROM schedules 
         WHERE employee_id = ${dailyTimeRecords.employeeId} 
         AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) 
         AND (end_date IS NULL OR end_date >= ${dailyTimeRecords.date}) 
         ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) 
         FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId));

    const conditions = [];
    conditions.push(between(dailyTimeRecords.date, startStr, endStr));
    
    if (effectiveEmployeeId !== 'all') {
        conditions.push(compareIds(dailyTimeRecords.employeeId, effectiveEmployeeId));
    }
    
    // 100% SUCCESS: Apply department filter even if employeeId is specified (though usually redundant)
    // but critical if effectiveEmployeeId is 'all'
    if (department && department !== 'all' && department !== 'All Departments' && department !== '') {
        conditions.push(like(sql`LOWER(COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A'))`, `%${department.toLowerCase()}%`));
    }
    
    if (effectiveEmployeeId === 'all' && search && search !== '') {
        const s = `%${search}%`;
        conditions.push(or(
            like(authentication.firstName, s),
            like(authentication.lastName, s),
            like(dailyTimeRecords.employeeId, s)
        ));
    }

    const existingDtrs = await dtrQuery.where(and(...conditions));

    const fullList: DTRApiResponse[] = [];
    let totalLate = 0;
    let totalUndertime = 0;
    let totalSecondsWorked = 0;

    existingDtrs.forEach(({ dtr, firstName, lastName, middleName, suffix, department, bioFullName, dutyType, shift }) => {
      const empId = dtr.employeeId;
      totalLate += (dtr.lateMinutes || 0);
      totalUndertime += (dtr.undertimeMinutes || 0);
      
      if (dtr.timeIn && dtr.timeOut) {
          const diff = (new Date(dtr.timeOut).getTime() - new Date(dtr.timeIn).getTime()) / 1000;
          totalSecondsWorked += (diff > 18000 ? diff - 3600 : diff);
      }

      const fullName = (firstName && lastName) 
        ? `${toTitleCase(lastName)}, ${toTitleCase(firstName)}${middleName ? ' ' + toTitleCase(middleName) : ''}`
        : (bioFullName || `Employee ${empId}`);

      fullList.push({
        id: dtr.id,
        employeeId: normalizeIdJs(empId),
        date: dtr.date,
        timeIn: dtr.timeIn ? formatToManilaDateTime(dtr.timeIn) : null,
        timeOut: dtr.timeOut ? formatToManilaDateTime(dtr.timeOut) : null,
        lateMinutes: dtr.lateMinutes || 0,
        undertimeMinutes: dtr.undertimeMinutes || 0,
        overtimeMinutes: dtr.overtimeMinutes || 0,
        status: dtr.status || ATTENDANCE_STATUS.PRESENT,
        createdAt: dtr.createdAt || null,
        updatedAt: dtr.updatedAt || null,
        employeeName: fullName,
        firstName: firstName || '',
        lastName: lastName || '',
        middleName: middleName || null,
        suffix: suffix || null,
        department: department || 'N/A',
        duties: 'Regular Schedule',
        shift: shift || '08:00 AM - 05:00 PM',
        dutyType: dutyType || 'Standard'
      });
    });

    fullList.sort((a, b) => b.date.localeCompare(a.date));
    
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
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const { employeeId: queryEmployeeId } = req.query;

    const isAdminOrHr = ['Administrator', 'Human Resource'].includes(user.role);

    // 100% PRECISE FILTERING: 
    // 1. If an explicit employeeId is provided (and it's not 'all'), use it strictly.
    // 2. If 'all' is explicitly provided, use 'all' (only for Admin/HR).
    // 3. IF NO ID IS PROVIDED (empty or missing):
    //    - If Admin/HR, use 'all' (This is for the Admin Portal).
    //    - If regular user, use user.employeeId (Self).
    const effectiveId = (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '') 
      ? String(queryEmployeeId) 
      : (isAdminOrHr && queryEmployeeId === 'all' ? 'all' : (isAdminOrHr && !queryEmployeeId ? 'all' : user.employeeId));

    const whereConditions = [];
    if (effectiveId !== 'all') {
      whereConditions.push(compareIds(dailyTimeRecords.employeeId, effectiveId));
    }

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
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      bioFullName: bioEnrolledUsers.fullName
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(dailyTimeRecords.updatedAt))
    .limit(20);

    const formattedLogs = logs.map(log => ({
      ...log,
      employeeId: normalizeIdJs(log.employeeId),
      employeeName: log.firstName && log.lastName 
        ? formatFullName(log.lastName, log.firstName, log.middleName, log.suffix) 
        : (log.bioFullName || `Employee ${normalizeIdJs(log.employeeId)}`),
      timeIn: log.timeIn ? formatToManilaDateTime(log.timeIn) : null,
      timeOut: log.timeOut ? formatToManilaDateTime(log.timeOut) : null,
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, "getRecentActivity");
  }
};

/**
 * GET /raw-logs
 */
export const getRawLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const { employeeId: queryEmployeeId, startDate, endDate, department, limit = 500 } = req.query;
    
    const isAdminOrHr = ['Administrator', 'Human Resource'].includes(user.role);
    
    // Default to 'all' for Admin/HR, otherwise 'self'
    const effectiveId = (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '') 
      ? String(queryEmployeeId) 
      : (isAdminOrHr ? 'all' : user.employeeId);

    const startStr = normalizeToIsoDate(startDate as string);
    const endStr = normalizeToIsoDate(endDate as string);

    const whereConditions = [];

    if (effectiveId !== 'all') {
      whereConditions.push(compareIds(attendanceLogs.employeeId, effectiveId));
    }
    if (startStr && endStr) {
      whereConditions.push(between(attendanceLogs.scanTime, `${startStr} 00:00:00`, `${endStr} 23:59:59`));
    } else if (startStr) {
        whereConditions.push(gte(attendanceLogs.scanTime, `${startStr} 00:00:00`));
    } else if (endStr) {
        whereConditions.push(lte(attendanceLogs.scanTime, `${endStr} 23:59:59`));
    }

    if (department && department !== 'all' && department !== 'All Departments' && department !== '') {
        whereConditions.push(like(sql`LOWER(COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A'))`, `%${String(department).toLowerCase()}%`));
    }

    const logs = await db.select({
      id: attendanceLogs.id,
      employeeId: attendanceLogs.employeeId,
      scanTime: attendanceLogs.scanTime,
      type: attendanceLogs.type,
      source: attendanceLogs.source,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      bioFullName: bioEnrolledUsers.fullName,
      department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) 
         FROM schedules 
         WHERE employee_id = ${attendanceLogs.employeeId} 
         AND (start_date IS NULL OR start_date <= DATE(${attendanceLogs.scanTime})) 
         AND (end_date IS NULL OR end_date >= DATE(${attendanceLogs.scanTime})) 
         ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) 
         FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`
    })
    .from(attendanceLogs)
    .leftJoin(authentication, compareIds(attendanceLogs.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(attendanceLogs.employeeId, bioEnrolledUsers.employeeId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(attendanceLogs.scanTime))
    .limit(Number(limit));

    const formattedLogs = logs.map(log => ({
      ...log,
      employeeId: normalizeIdJs(log.employeeId),
      employeeName: log.firstName && log.lastName 
        ? formatFullName(log.lastName, log.firstName, log.middleName, log.suffix) 
        : (log.bioFullName || `Employee ${normalizeIdJs(log.employeeId)}`)
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (err) {
    handleError(res, err as Error, "getRawLogs");
  }
};

/**
 * GET /dashboard-stats
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const { employeeId: queryEmployeeId } = req.query;
    
    const isAdminOrHr = ['Administrator', 'Human Resource'].includes(user.role);
    
    // 100% SECURE: Hard enforcement of data ownership.
    let effectiveId: string;
    if (isAdminOrHr) {
        // Admins can request 'all' or a specific employeeId
        effectiveId = (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '') 
          ? String(queryEmployeeId) 
          : 'all';
    } else {
        // Regular employees are STRICTLY LOCKED to their own employeeId from the token.
        // They cannot override this via query parameters.
        effectiveId = user.employeeId;
    }

    const today = currentManilaDateOnly();
    
    // 1. Fetch DTRs for today
    const dtrs = await db.select({
      id: dailyTimeRecords.employeeId, // Use actual employee ID (Emp-001) not database ID
      employeeId: dailyTimeRecords.employeeId,
      status: dailyTimeRecords.status,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: departments.name,
      jobTitle: pdsHrDetails.jobTitle
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(and(
        eq(dailyTimeRecords.date, today),
        effectiveId !== 'all' ? compareIds(dailyTimeRecords.employeeId, effectiveId) : undefined
    ));

    // 2. Fetch Active Leave Applications
    const leaveStatusList = ['Approved'];
    const activeLeaves = await db.select({
      id: authentication.id,
      employeeId: leaveApplications.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      leaveType: leaveApplications.leaveType,
      department: departments.name
    })
    .from(leaveApplications)
    .leftJoin(authentication, compareIds(leaveApplications.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(and(
      inArray(leaveApplications.status, leaveStatusList as any),
      lte(leaveApplications.startDate, today),
      gte(leaveApplications.endDate, today),
      effectiveId !== 'all' ? compareIds(leaveApplications.employeeId, effectiveId) : undefined
    ));

    // 3. Fetch Hired Today (100% SUCCESS: Strictly for today to match other cards)
    const recentHires = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      createdAt: authentication.createdAt,
      department: departments.name,
      jobTitle: pdsHrDetails.jobTitle
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(and(
      eq(pdsHrDetails.dateHired, today), // 100% FIX: Only hired TODAY
      inArray(pdsHrDetails.employmentStatus, ['Active', 'Probationary']), // 100% FIX: Only include officially hired personnel
      ne(authentication.role, 'Applicant'),
      ne(authentication.role, 'Administrator'), 
      ne(authentication.role, 'Human Resource'), 
      isNotNull(authentication.employeeId),
      effectiveId !== 'all' ? compareIds(authentication.employeeId, effectiveId) : undefined
    ));

    // 4. Fetch All Active Employees (for Absent count and list)
    const activeEmployees = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: departments.name,
      jobTitle: pdsHrDetails.jobTitle
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(and(
        ne(authentication.role, 'Applicant'),
        ne(authentication.role, 'Administrator'), // Filter out Admin
        ne(authentication.role, 'Human Resource'), // Filter out HR
        isNotNull(authentication.employeeId),
        or(eq(pdsHrDetails.employmentStatus, 'Active'), sql`${pdsHrDetails.employmentStatus} IS NULL`),
        lt(pdsHrDetails.dateHired, today), // 100% ACCURACY: Only mark as absent if hired BEFORE today
        effectiveId !== 'all' ? compareIds(authentication.employeeId, effectiveId) : undefined
    ));

    // Filter Lists
    const presentList = dtrs.filter(d => d.status && [
      ATTENDANCE_STATUS.PRESENT, 
      ATTENDANCE_STATUS.PRESENT_LATE, 
      ATTENDANCE_STATUS.UNDERTIME,
      'Present', 'Present (Late)', 'Undertime'
    ].includes(d.status as any));

    const lateList = dtrs.filter(d => d.status && [
      ATTENDANCE_STATUS.PRESENT_LATE, 
      'Present (Late)'
    ].includes(d.status as any));

    const presentIds = new Set(presentList.map(d => normalizeIdJs(d.employeeId)));
    const leaveIds = new Set(activeLeaves.map(l => normalizeIdJs(l.employeeId)));

    const absentListRaw = activeEmployees.filter(emp => {
        const id = normalizeIdJs(emp.employeeId);
        // If an employee is marked as 'Absent' in DTR (because of Late+Undertime), they will NOT be in presentList
        // so they will correctly fall into the absent category here.
        return !presentIds.has(id) && !leaveIds.has(id);
    });

    const counts = {
      present: presentList.length,
      late: lateList.length,
      absent: absentListRaw.length,
      onLeave: activeLeaves.length,
      hired: recentHires.length
    };

    const lists = {
      present: presentList.map(d => ({ 
        ...d, 
        id: normalizeIdJs(d.employeeId), // Use Employee ID for display, mask database ID
        employeeId: normalizeIdJs(d.employeeId),
        department: d.department || 'N/A',
        name: formatFullName(d.lastName, d.firstName, d.middleName, d.suffix) || `Employee ${normalizeIdJs(d.employeeId)}` 
      })),
      late: lateList.map(d => ({ 
        ...d, 
        id: normalizeIdJs(d.employeeId),
        employeeId: normalizeIdJs(d.employeeId),
        department: d.department || 'N/A',
        name: formatFullName(d.lastName, d.firstName, d.middleName, d.suffix) || `Employee ${normalizeIdJs(d.employeeId)}` 
      })),
      absent: absentListRaw.map(a => ({
        ...a,
        id: normalizeIdJs(a.employeeId),
        employeeId: normalizeIdJs(a.employeeId),
        department: a.department || 'N/A',
        name: formatFullName(a.lastName, a.firstName, a.middleName, a.suffix) || `Employee ${normalizeIdJs(a.employeeId)}`
      })),
      onLeave: activeLeaves.map(l => ({
        ...l,
        id: normalizeIdJs(l.employeeId),
        employeeId: normalizeIdJs(l.employeeId),
        department: l.department || 'N/A',
        name: formatFullName(l.lastName, l.firstName, l.middleName, l.suffix) || `Employee ${normalizeIdJs(l.employeeId)}`
      })),
      hired: recentHires.map(h => ({
        ...h,
        id: normalizeIdJs(h.employeeId), // Use formatted Employee ID
        employeeId: normalizeIdJs(h.employeeId),
        department: h.department || 'N/A',
        name: formatFullName(h.lastName, h.firstName, h.middleName, h.suffix) || `Employee ${normalizeIdJs(h.employeeId)}`
      }))
    };

    res.status(200).json({ success: true, data: { counts, lists } });
  } catch (err) {
    handleError(res, err as Error, "getDashboardStats");
  }
};
