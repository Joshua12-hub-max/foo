import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { bioEnrolledUsers, bioAttendanceLogs } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSyncInfo } from '../services/pollingService.js';

/**
 * GET /api/biometric/enrolled
 * Returns all enrolled biometric users from the C# middleware table.
 */
export const getEnrolledUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select({
      employeeId: bioEnrolledUsers.employeeId,
      systemEmployeeId: sql<string>`CONCAT('EMP-', LPAD(${bioEnrolledUsers.employeeId}, 3, '0'))`,
      fullName: bioEnrolledUsers.fullName,
      department: bioEnrolledUsers.department,
      userStatus: bioEnrolledUsers.userStatus,
      enrolledAt: bioEnrolledUsers.enrolledAt,
      updatedAt: bioEnrolledUsers.updatedAt,
    })
    .from(bioEnrolledUsers)
    .orderBy(bioEnrolledUsers.employeeId);

    res.status(200).json({
      success: true,
      message: 'Enrolled biometric users retrieved successfully.',
      data: users,
      total: users.length,
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled users.',
    });
  }
};

/**
 * GET /api/biometric/logs
 * Returns raw biometric attendance logs from the C# middleware table.
 * Query params: ?employeeId=1&date=2026-02-17&limit=100
 */
export const getBiometricLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, date, limit } = req.query;
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(bioAttendanceLogs.employeeId, Number(employeeId)));
    }

    if (date) {
      conditions.push(eq(bioAttendanceLogs.logDate, String(date)));
    }

    const queryLimit = Math.min(Number(limit) || 100, 500);

    const logs = await db.select({
      id: bioAttendanceLogs.id,
      employeeId: bioAttendanceLogs.employeeId,
      systemEmployeeId: sql<string>`CONCAT('EMP-', LPAD(${bioAttendanceLogs.employeeId}, 3, '0'))`,
      cardType: bioAttendanceLogs.cardType,
      logDate: bioAttendanceLogs.logDate,
      logTime: bioAttendanceLogs.logTime,
      createdAt: bioAttendanceLogs.createdAt,
    })
    .from(bioAttendanceLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bioAttendanceLogs.id))
    .limit(queryLimit);

    res.status(200).json({
      success: true,
      message: 'Biometric logs retrieved successfully.',
      data: logs,
      total: logs.length,
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve biometric logs.',
    });
  }
};

/**
 * GET /api/biometric/sync-status
 * Returns the current sync status between bio_attendance_logs and attendance_logs.
 */
export const getSyncStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const syncInfo = getSyncInfo();

    // Get counts for comparison
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
        status: syncInfo.lastSyncedBioId >= (bioCount?.count ?? 0) ? 'SYNCED' : 'SYNCING',
      },
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sync status.',
    });
  }
};


