import { Request, Response } from "express";
import { db } from "../db/index.js";
import { 
  attendanceLogs, 
  dailyTimeRecords, 
  authentication, 
  leaveApplications, 
  recruitmentApplicants, 
  recruitmentJobs,
  bioEnrolledUsers,
  dtrCorrections,
  departments,
  pdsHrDetails
} from "../db/schema.js";
import { eq, and, sql, desc, between, or, like } from "drizzle-orm";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  GetLogsSchema,
  GetTodayStatusSchema,
} from "../schemas/attendanceSchema.js";
import { AttendanceLogApiResponse, DTRApiResponse } from "../types/attendance.js";
import { formatToManilaDateTime, currentManilaDateTime } from "../utils/dateUtils.js";
import { compareIds } from "../utils/idUtils.js";
import { processDailyAttendance } from "../services/attendanceProcessor.js";


const handleError = (res: Response, _error: Error, context: string): void => {

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

// Helper to enforce Normal Case (Title Case)
const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return "";
  return str.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
};

interface AttendanceLog {
  id: number;
  employeeId: string | null;
  scanTime: string | Date | null;
  type: 'IN' | 'OUT' | null;
  source: string | null;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  dutyType: string | null;
  duties: string | null;
  shift: string | null;
  dtrStatus: string | null;
}

const mapToAttendanceLogApi = (log: AttendanceLog): AttendanceLogApiResponse => {
  const employeeId = log.employeeId || '';
  const scanTimeRaw = log.scanTime;
  const scanTime = scanTimeRaw ? new Date(scanTimeRaw).toISOString() : '';
  
  return {
    id: log.id,
    employeeId, 
    scanTime,
    type: (log.type || 'IN') as 'IN' | 'OUT',
    source: log.source || 'Unknown',
    firstName: log.firstName || null,
    lastName: log.lastName || null,
    department: log.department || 'N/A',
    duties: log.duties || 'Standard Shift',
    shift: log.shift || '08:00 AM - 05:00 PM',
    dutyType: log.dutyType || 'Standard',
    dtrStatus: log.dtrStatus || 'N/A'
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
  const isAdminOrHr = ["Administrator", "Human Resource"].includes(user.role);

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
  let targetEmployeeId = queryEmployeeId || queryId;
  if (!targetEmployeeId && !isAdminOrHr) {
    targetEmployeeId = user.employeeId;
  }

  const page = qPage;
  const limit = qLimit;
  const offset = (page - 1) * limit;

  try {
    const whereConditions = [];
    if (targetEmployeeId && targetEmployeeId !== 'all' && targetEmployeeId !== 'All Employees') {
      whereConditions.push(compareIds(dailyTimeRecords.employeeId, targetEmployeeId as string));
    }
    if (startDate && endDate) {
      whereConditions.push(between(dailyTimeRecords.date, startDate, endDate));
    }
    if (department && department !== 'all') {
      whereConditions.push(eq(departments.name, department));
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
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      bioFullName: bioEnrolledUsers.fullName,
      department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`,
      dutyType: sql<string>`COALESCE(${pdsHrDetails.dutyType}, 'Standard')`,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) AND (end_date IS NULL OR end_date >= ${dailyTimeRecords.date}) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) AND (end_date IS NULL OR end_date >= ${dailyTimeRecords.date}) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${dailyTimeRecords.employeeId} AND (start_date IS NULL OR start_date <= ${dailyTimeRecords.date}) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`,
      correctionId: dtrCorrections.id,
      correctionStatus: dtrCorrections.status,
      correctionReason: dtrCorrections.reason,
      correctionTimeIn: dtrCorrections.correctedTimeIn,
      correctionTimeOut: dtrCorrections.correctedTimeOut,
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
    .leftJoin(
      dtrCorrections,
      and(
        eq(dtrCorrections.employeeId, dailyTimeRecords.employeeId),
        eq(dtrCorrections.dateTime, dailyTimeRecords.date),
        eq(dtrCorrections.status, 'Pending')
      )
    )
    .where(whereClause)
    .orderBy(desc(dailyTimeRecords.date))
    .limit(limit)
    .offset(offset);

    // Calculate totals with the 1-hour break policy included in the SQL
    const [totalsResult] = await db.select({
      totalLate: sql<string>`SUM(COALESCE(${dailyTimeRecords.lateMinutes}, 0))`,
      totalUndertime: sql<string>`SUM(COALESCE(${dailyTimeRecords.undertimeMinutes}, 0))`,
      totalSeconds: sql<string>`SUM(
        COALESCE(
          CASE 
            WHEN TIMESTAMPDIFF(SECOND, ${dailyTimeRecords.timeIn}, ${dailyTimeRecords.timeOut}) > 18000 
            THEN TIMESTAMPDIFF(SECOND, ${dailyTimeRecords.timeIn}, ${dailyTimeRecords.timeOut}) - 3600
            ELSE TIMESTAMPDIFF(SECOND, ${dailyTimeRecords.timeIn}, ${dailyTimeRecords.timeOut})
          END, 
          0
        )
      )`
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(whereClause);

    const [countResult] = await db.select({
      total: sql<number>`count(*)`
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(whereClause);

    const total = Number(countResult.total || 0);

    const formattedLogs: DTRApiResponse[] = logs.map((log) => {
      // Precise Name Formatting: Normal Case (Title Case)
      let fullName = "Unknown Employee";
      
      const hasAuthName = log.firstName?.trim() && log.lastName?.trim();
      
      if (hasAuthName) {
          const last = toTitleCase(log.lastName!);
          const first = toTitleCase(log.firstName!);
          const middle = log.middleName ? ` ${toTitleCase(log.middleName)}` : "";
          const suffix = log.suffix ? ` ${log.suffix}` : "";
          fullName = `${last}, ${first}${middle}${suffix}`;
      } else if (log.bioFullName?.trim()) {
          fullName = log.bioFullName.trim();
      }

      return {
        id: log.id,
        employeeId: log.employeeId,
        date: log.date, 
        timeIn: log.timeIn ? formatToManilaDateTime(log.timeIn) : null,
        timeOut: log.timeOut ? formatToManilaDateTime(log.timeOut) : null,
        lateMinutes: log.lateMinutes || 0,
        undertimeMinutes: log.undertimeMinutes || 0,
        overtimeMinutes: log.overtimeMinutes || 0,
        status: log.status || 'Pending',
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
        updatedAt: log.updatedAt ? new Date(log.updatedAt).toISOString() : null,
        employeeName: fullName,
        firstName: log.firstName || '',
        lastName: log.lastName || '',
        middleName: log.middleName || null,
        suffix: log.suffix || null,
        department: log.department || "N/A",
        duties: log.dutyType || 'Standard',
        shift: log.shift || 'No Schedule',
        dutyType: log.dutyType || 'Standard',
        correctionId: log.correctionId ?? null,
        correctionStatus: log.correctionStatus ?? null,
        correctionReason: log.correctionReason ?? null,
        correctionTimeIn: log.correctionTimeIn ? formatToManilaDateTime(log.correctionTimeIn) : null,
        correctionTimeOut: log.correctionTimeOut ? formatToManilaDateTime(log.correctionTimeOut) : null,
      };
    });

    res.status(200).json({
      success: true,
      message: formattedLogs.length > 0 ? "Logs retrieved successfully." : "No logs found.",
      data: formattedLogs,
      totals: {
        lateMinutes: Number(totalsResult?.totalLate || 0),
        undertimeMinutes: Number(totalsResult?.totalUndertime || 0),
        hoursWorked: (Number(totalsResult?.totalSeconds || 0) / 3600).toFixed(2)
      },
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
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: departments.name,
      bioFullName: bioEnrolledUsers.fullName
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
    .orderBy(desc(dailyTimeRecords.updatedAt))
    .limit(20);

    const formattedLogs: DTRApiResponse[] = logs.map((log) => {
      let fullName = "Unknown Employee";
      if (log.firstName && log.lastName) {
          const last = toTitleCase(log.lastName);
          const first = toTitleCase(log.firstName);
          const middle = log.middleName ? ` ${toTitleCase(log.middleName)}` : "";
          const suffix = log.suffix ? ` ${log.suffix}` : "";
          fullName = `${last}, ${first}${middle}${suffix}`;
      } else if (log.bioFullName) {
          fullName = log.bioFullName;
      }

      return {
        id: log.id,
        employeeId: log.employeeId,
        date: log.date,
        timeIn: log.timeIn ? formatToManilaDateTime(log.timeIn) : null,
        timeOut: log.timeOut ? formatToManilaDateTime(log.timeOut) : null,
        lateMinutes: 0, 
        undertimeMinutes: 0,
        overtimeMinutes: 0,
        status: log.status || 'Pending',
        createdAt: null,
        updatedAt: log.updatedAt || null,
        employeeName: fullName,
        firstName: log.firstName || '',
        lastName: log.lastName || '',
        middleName: log.middleName || null,
        suffix: log.suffix || null,
        department: log.department || "N/A",
        duties: 'No Schedule',
        shift: 'No Schedule',
        dutyType: 'Standard',
      };
    });

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

  const employeeId = query.employeeId || user.employeeId;

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

    if (employeeId && employeeId !== 'all' && employeeId !== 'All Employees') {
      whereConditions.push(compareIds(attendanceLogs.employeeId, String(employeeId)));
    }

    if (startDate && endDate) {
       whereConditions.push(between(attendanceLogs.scanTime, `${startDate} 00:00:00`, `${endDate} 23:59:59`));
    }

    if (department && department !== 'All Departments') {
       whereConditions.push(
         sql`COALESCE(${departments.name}, ${bioEnrolledUsers.department}) = ${String(department)}`
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
      employeeId: attendanceLogs.employeeId,
      scanTime: attendanceLogs.scanTime,
      type: attendanceLogs.type,
      source: attendanceLogs.source,
      firstName: sql<string>`COALESCE(
        ${authentication.firstName},
        SUBSTRING_INDEX(${bioEnrolledUsers.fullName}, ' ', 1)
      )`,
      lastName: sql<string>`COALESCE(
        ${authentication.lastName},
        CASE WHEN LOCATE(' ', ${bioEnrolledUsers.fullName}) > 0
          THEN SUBSTRING(${bioEnrolledUsers.fullName}, LOCATE(' ', ${bioEnrolledUsers.fullName}) + 1)
          ELSE ''
        END
      )`,
      department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`,
      dutyType: sql<string>`COALESCE(${pdsHrDetails.dutyType}, 'Standard')`,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE employee_id = ${attendanceLogs.employeeId} AND (start_date IS NULL OR start_date <= DATE(${attendanceLogs.scanTime})) AND (end_date IS NULL OR end_date >= DATE(${attendanceLogs.scanTime})) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE employee_id = ${attendanceLogs.employeeId} AND (start_date IS NULL OR start_date <= DATE(${attendanceLogs.scanTime})) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${attendanceLogs.employeeId} AND (start_date IS NULL OR start_date <= DATE(${attendanceLogs.scanTime})) AND (end_date IS NULL OR end_date >= DATE(${attendanceLogs.scanTime})) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${attendanceLogs.employeeId} AND (start_date IS NULL OR start_date <= DATE(${attendanceLogs.scanTime})) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`,
      dtrStatus: sql<string>`COALESCE((SELECT status FROM daily_time_records WHERE employee_id = ${attendanceLogs.employeeId} AND date = DATE(${attendanceLogs.scanTime}) LIMIT 1), 'Pending')`
    })
    .from(attendanceLogs)
    .leftJoin(authentication, compareIds(attendanceLogs.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, attendanceLogs.employeeId))
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
    // const now = new Date();
    // const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // const dayName = days[now.getDay()];

    /* const allEmployees = await db.select({
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
    .orderBy(desc(authentication.dateHired)); */


    const dtrRecords = await db.select({
      employeeId: dailyTimeRecords.employeeId,
      status: dailyTimeRecords.status,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      lateMinutes: dailyTimeRecords.lateMinutes,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: departments.name,
      bioFullName: bioEnrolledUsers.fullName,
      bioDepartment: bioEnrolledUsers.department
    })
    .from(dailyTimeRecords)
    .leftJoin(authentication, compareIds(dailyTimeRecords.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, dailyTimeRecords.employeeId))
    .where(eq(dailyTimeRecords.date, todayStr));

    const leaves = await db.select({
      employeeId: leaveApplications.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      department: departments.name,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate
    })
    .from(leaveApplications)
    .innerJoin(authentication, compareIds(leaveApplications.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
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

    // const enrolledBio = await db.select({ employeeId: bioEnrolledUsers.employeeId }).from(bioEnrolledUsers);
    // const enrolledSet = new Set(enrolledBio.map(b => String(b.employeeId)));

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

    const getName = (first: string | null, last: string | null, bioName: string | null) => {
        if (first && last) return `${toTitleCase(first)} ${toTitleCase(last)}`;
        if (bioName) return bioName;
        return "Unknown Employee";
    };

    const getDept = (authDept: string | null, bioDept: string | null) => {
        return authDept || bioDept || "N/A";
    };

    const processedIds = new Set<string>();
    const onLeaveEmployeeIds = new Set(leaves.map((l) => l.employeeId));

    dtrRecords.forEach(record => {
        processedIds.add(record.employeeId);
        if (onLeaveEmployeeIds.has(record.employeeId)) return; 

        const name = getName(record.firstName, record.lastName, record.bioFullName);
        const dept = getDept(record.department, record.bioDepartment);

        const statusItem: StatusRecord = {
          id: record.employeeId,
          name,
          department: dept,
          status: record.status || "Pending",
          timeIn: formatTime(record.timeIn),
          timeOut: formatTime(record.timeOut),
          date: todayStr,
          minutesLate: record.lateMinutes || 0,
        };

        if (record.status === 'Late' || record.status === 'Late/Undertime') {
            lateList.push(statusItem);
            presentList.push(statusItem);
        } else if (record.status === 'Present' || record.status === 'Undertime' || record.status === 'Pending' || !record.status) {
            presentList.push(statusItem);
        }
    });

    // User specifically requested NOT to synthesize Absent records without Time In/Out
    // Removed allEmployees loop that adds to absentList.
    // Dashboard will only show records with actual physical clock-ins or approved leaves.

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
            id: String(a.id),
            name: `${toTitleCase(a.firstName)} ${toTitleCase(a.lastName)}`,
            department: a.departmentName || "-",
            position: a.jobTitle || "-",
            dateHired: formatDate(a.hiredDate || a.createdAt),
          })),
          onLeave: leaves.map((l) => ({
            id: l.employeeId,
            name: `${toTitleCase(l.firstName)} ${toTitleCase(l.lastName)}`,
            department: l.department || "-",
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
          })),
        },
      },
    });
  } catch (err: unknown) {
    handleError(res, err as Error, "getDashboardStats");
  }
};

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.employeeId) {
      res.status(401).json({ success: false, message: "Unauthorized: Missing employee ID" });
      return;
    }

    const todayStr = getLocalDate();
    const nowStr = currentManilaDateTime();

    // Check if a time-in log already exists today to prevent cheating
    const existingIn = await db.select()
      .from(attendanceLogs)
      .where(and(
        compareIds(attendanceLogs.employeeId, authReq.user.employeeId),
        eq(attendanceLogs.type, 'IN'),
        sql`DATE(${attendanceLogs.scanTime}) = DATE(${todayStr})`
      ))
      .limit(1);

    if (existingIn.length > 0) {
      res.status(400).json({ success: false, message: "You have already clocked in today." });
      return;
    }

    await db.insert(attendanceLogs).values({
      employeeId: authReq.user.employeeId,
      scanTime: nowStr,
      type: 'IN',
      source: 'Manual Widget',
      createdAt: nowStr
    });

    // Automatically calculate Tardiness/Undertime & re-seed DTR
    await processDailyAttendance(authReq.user.employeeId, todayStr);

    res.status(200).json({ success: true, message: "Successfully clocked in." });
  } catch (err: unknown) {
    handleError(res, err as Error, "clockIn");
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.employeeId) {
      res.status(401).json({ success: false, message: "Unauthorized: Missing employee ID" });
      return;
    }

    const todayStr = getLocalDate();
    const nowStr = currentManilaDateTime();

    // Check if clocked in first
    const existingIn = await db.select()
      .from(attendanceLogs)
      .where(and(
        compareIds(attendanceLogs.employeeId, authReq.user.employeeId),
        eq(attendanceLogs.type, 'IN'),
        sql`DATE(${attendanceLogs.scanTime}) = DATE(${todayStr})`
      ))
      .limit(1);

    if (existingIn.length === 0) {
      res.status(400).json({ success: false, message: "Cannot clock out. No clock in record found for today." });
      return;
    }

    // Check if already clocked out
    const existingOut = await db.select()
      .from(attendanceLogs)
      .where(and(
        compareIds(attendanceLogs.employeeId, authReq.user.employeeId),
        eq(attendanceLogs.type, 'OUT'),
        sql`DATE(${attendanceLogs.scanTime}) = DATE(${todayStr})`
      ))
      .limit(1);

    if (existingOut.length > 0) {
      res.status(400).json({ success: false, message: "You have already clocked out today." });
      return;
    }

    await db.insert(attendanceLogs).values({
      employeeId: authReq.user.employeeId,
      scanTime: nowStr,
      type: 'OUT',
      source: 'Manual Widget',
      createdAt: nowStr
    });

    await processDailyAttendance(authReq.user.employeeId, todayStr);

    res.status(200).json({ success: true, message: "Successfully clocked out." });
  } catch (err: unknown) {
    handleError(res, err as Error, "clockOut");
  }
};


