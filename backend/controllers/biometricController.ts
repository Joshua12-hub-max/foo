import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { bioEnrolledUsers, bioAttendanceLogs, authentication, pdsHrDetails, departments } from '../db/schema.js';
import { eq, and, desc, sql, between, like, gte, lte } from 'drizzle-orm';
import { getSyncInfo } from '../services/pollingService.js';
import { compareIds, normalizeIdJs } from '../utils/idUtils.js';
import { AuthenticatedRequest } from '../types/index.js';
import { formatFullName } from '../utils/nameUtils.js';
import { normalizeToIsoDate } from '../utils/dateUtils.js';

/**
 * GET /api/biometric/enrolled
 * Returns all enrolled biometric users from the C# middleware table.
 */
export const getEnrolledUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select({
      employeeId: bioEnrolledUsers.employeeId,
      fullName: bioEnrolledUsers.fullName,
      department: bioEnrolledUsers.department,
      userStatus: bioEnrolledUsers.userStatus,
      enrolledAt: bioEnrolledUsers.enrolledAt,
      updatedAt: bioEnrolledUsers.updatedAt,
    })
    .from(bioEnrolledUsers)
    .orderBy(bioEnrolledUsers.employeeId);

    const formattedUsers = users.map(u => ({
      ...u,
      employeeId: normalizeIdJs(u.employeeId)
    }));

    res.status(200).json({
      success: true,
      message: 'Enrolled biometric users retrieved successfully.',
      data: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (_error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled users.',
    });
  }
};

/**
 * GET /api/biometric/logs
 * Fully enriched logs with official Names and Shift Info.
 * 100% FIXED: Resolves 'unknown' names and missing shift.
 */
export const getBiometricLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const { employeeId: queryEmployeeId, date, startDate, endDate, department, limit } = req.query;
    
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

    const conditions = [];

    if (effectiveId !== 'all') {
      conditions.push(compareIds(bioAttendanceLogs.employeeId, effectiveId));
    }

    const startStr = normalizeToIsoDate(startDate as string) || normalizeToIsoDate(date as string);
    const endStr = normalizeToIsoDate(endDate as string) || normalizeToIsoDate(date as string);

    if (startStr && endStr) {
      conditions.push(between(bioAttendanceLogs.logDate, startStr, endStr));
    } else if (startStr) {
      conditions.push(gte(bioAttendanceLogs.logDate, startStr));
    } else if (endStr) {
      conditions.push(lte(bioAttendanceLogs.logDate, endStr));
    }

    if (department && department !== 'all' && department !== 'All Departments' && department !== '') {
        conditions.push(like(sql`LOWER(COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A'))`, `%${String(department).toLowerCase()}%`));
    }

    const queryLimit = Math.min(Number(limit) || 100, 500);

    const logs = await db.select({
      id: bioAttendanceLogs.id,
      employeeId: bioAttendanceLogs.employeeId,
      cardType: bioAttendanceLogs.cardType,
      logDate: bioAttendanceLogs.logDate,
      logTime: bioAttendanceLogs.logTime,
      createdAt: bioAttendanceLogs.createdAt,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      bioFullName: bioEnrolledUsers.fullName,
      // 100% ENRICHMENT: Fetch Shift/Duty Info
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) 
         FROM schedules 
         WHERE employee_id = ${bioAttendanceLogs.employeeId} 
         AND (start_date IS NULL OR start_date <= ${bioAttendanceLogs.logDate}) 
         AND (end_date IS NULL OR end_date >= ${bioAttendanceLogs.logDate}) 
         ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) 
         FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`,
      department: sql<string>`COALESCE(${departments.name}, ${bioEnrolledUsers.department}, 'N/A')`
    })
    .from(bioAttendanceLogs)
    .leftJoin(authentication, compareIds(bioAttendanceLogs.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, compareIds(bioEnrolledUsers.employeeId, bioAttendanceLogs.employeeId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bioAttendanceLogs.id))
    .limit(queryLimit);

    const formattedLogs = logs.map(log => ({
      ...log,
      employeeId: normalizeIdJs(log.employeeId),
      employeeName: log.firstName && log.lastName 
        ? formatFullName(log.lastName, log.firstName, log.middleName, log.suffix) 
        : (log.bioFullName || `Employee ${normalizeIdJs(log.employeeId)}`)
    }));

    res.status(200).json({
      success: true,
      message: 'Biometric logs retrieved successfully.',
      data: formattedLogs,
      total: formattedLogs.length,
    });
  } catch (_error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve biometric logs.',
    });
  }
};

/**
 * GET /api/biometric/sync-status
 */
export const getSyncStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const syncInfo = getSyncInfo();

    const [bioCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(bioAttendanceLogs);

    const [enrolledCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(bioEnrolledUsers);

    res.status(200).json({
      success: true,
      message: 'Sync status retrieved.',
      data: {
        lastSyncedBioId: syncInfo.lastSyncedBioId,
        isCurrentlyPolling: syncInfo.isPolling,
        totalBioLogs: bioCount?.count ?? 0,
        totalEnrolledUsers: enrolledCount?.count ?? 0,
        status: 'ACTIVE',
      },
    });
  } catch (_error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sync status.',
    });
  }
};
