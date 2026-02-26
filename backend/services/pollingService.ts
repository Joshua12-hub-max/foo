import { db } from '../db/index.js';
import { bioAttendanceLogs, attendanceLogs } from '../db/schema.js';
import { gt, eq, sql } from 'drizzle-orm';
import { processDailyAttendance } from './attendanceProcessor.js';

// Track the last synced bio_attendance_logs ID (monotonic, avoids clock drift)
let lastSyncedBioId = 0;
let isPolling = false;

/**
 * Convert biometric employee_id (int: 1, 2, 3...) to system format (EMP-001, EMP-002, EMP-003...).
 * Capacity: up to EMP-200.
 */
/**
 * Convert biometric employee_id (int) to system format.
 * NOW CHANGED: Returns raw ID string (e.g. "1") instead of "EMP-001".
 */
const convertBioIdToEmployeeId = (bioId: number): string => {
  return String(bioId); // Return raw ID, formatting happens on frontend
};

/**
 * Polls bio_attendance_logs for new entries created by the C# biometric middleware.
 * Syncs them into attendance_logs with proper EMP-XXX conversion, then triggers DTR processing.
 */
async function pollBiometricLogs() {
  if (isPolling) return;
  isPolling = true;

  try {
    // 1. Fetch new bio logs since last synced ID
    const newBioLogs = await db.select()
      .from(bioAttendanceLogs)
      .where(gt(bioAttendanceLogs.id, lastSyncedBioId))
      .orderBy(bioAttendanceLogs.id);

    if (newBioLogs.length === 0) return;

    console.log(`[BIO-SYNC] Found ${newBioLogs.length} new biometric log(s) since ID ${lastSyncedBioId}`);

    // Track which employee+date combos need DTR reprocessing
    const processQueue = new Map<string, { employeeId: string; dateStr: string }>();

    for (const bioLog of newBioLogs) {
      try {
        // 2. Convert bio employee_id (int) → system format (EMP-XXX)
        const systemEmployeeId = convertBioIdToEmployeeId(bioLog.employeeId);

        // 4. Map card_type → type (both use 'IN'/'OUT' so direct mapping)

        // --- REMOVED DB INSERTION INTO attendanceLogs ---
        // The C# middleware (Form1.cs) already inserts this record directly real-time.
        // Doing it again here creates duplicates or race conditions.
        // We solely use this loop to trigger processDailyAttendance.

        // 7. Queue DTR processing for this employee+date
        const dateStr = bioLog.logDate;
        const key = `${systemEmployeeId}:${dateStr}`;
        if (!processQueue.has(key)) {
          processQueue.set(key, { employeeId: systemEmployeeId, dateStr });
        }
      } catch (err) {
        console.error(`[BIO-SYNC] Failed to sync bio log ID ${bioLog.id}:`, err);
      }
    }

    // 8. Update lastSyncedBioId to the highest ID we processed
    lastSyncedBioId = newBioLogs[newBioLogs.length - 1].id;

    // 9. Process DTR for all affected employee+date combos
    for (const { employeeId, dateStr } of processQueue.values()) {
      try {
        await processDailyAttendance(employeeId, dateStr);
      } catch (err) {
        console.error(`[BIO-SYNC] DTR processing failed for ${employeeId} on ${dateStr}:`, err);
      }
    }

  } catch (error) {
    console.error('[BIO-SYNC] Polling error:', error);
  } finally {
    isPolling = false;
  }
}

/**
 * Initialize lastSyncedBioId by checking the max ID already synced.
 * This prevents re-syncing old logs on server restart.
 */
async function initializeLastSyncedId() {
  try {
    const [result] = await db.select({
      maxId: sql<number>`COALESCE(MAX(id), 0)`
    }).from(bioAttendanceLogs);

    lastSyncedBioId = result?.maxId ?? 0;

    // Also check if existing attendance_logs already cover these bio logs
    // by counting how many bio logs we have vs attendance_logs with BIOMETRIC source
    const [bioCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(bioAttendanceLogs);

    const [attCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(attendanceLogs)
    .where(eq(attendanceLogs.source, 'BIOMETRIC'));

    console.log(`[BIO-SYNC] Initialized: lastSyncedBioId=${lastSyncedBioId}, bioLogs=${bioCount?.count ?? 0}, syncedAttLogs=${attCount?.count ?? 0}`);

    // If there are unsynced bio logs (bio count > synced attendance count), reset to 0 to re-sync
    if ((bioCount?.count ?? 0) > (attCount?.count ?? 0)) {
      lastSyncedBioId = 0;
      console.log('[BIO-SYNC] Detected unsynced bio logs. Resetting lastSyncedBioId to 0 for full sync.');
    }

  } catch (error) {
    console.error('[BIO-SYNC] Failed to initialize lastSyncedBioId:', error);
    lastSyncedBioId = 0;
  }
}

/**
 * Get the current sync status (used by the API).
 */
export const getSyncInfo = () => ({
  lastSyncedBioId,
  isPolling,
});

/**
 * Starts the background biometric polling service.
 * @param intervalMs Polling interval in milliseconds (default: 5000ms)
 */
export const startPollingService = async (intervalMs: number = 5000) => {
  try {
    console.log(`[BIO-SYNC] Starting biometric sync service... Interval: ${intervalMs}ms`);

    // Initialize the last synced ID from the database
    await initializeLastSyncedId();

    // Start polling
    setInterval(pollBiometricLogs, intervalMs);
  } catch (err) {
    const error = err as Error;
    console.error('[BIO-SYNC] Failed to start polling service:', error.message);
  }
};
