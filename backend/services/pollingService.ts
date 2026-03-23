import { db } from '../db/index.js';
import { bioAttendanceLogs, attendanceLogs } from '../db/schema.js';
import { gt, eq, sql } from 'drizzle-orm';
import { processDailyAttendance } from './attendanceProcessor.js';

// Track the last synced bio_attendance_logs ID (monotonic, avoids clock drift)
let lastSyncedBioId = 0;
let isPolling = false;

/**
 * Normalizes an employee ID by removing common prefixes like 'EMP-' or 'CHRMO-'
 * and any other non-digit characters.
 */
const convertBioIdToEmployeeId = (bioId: string): string => {
  // Robust normalization: extract only digits
  const numericId = bioId.replace(/\D/g, '');
  return numericId || bioId; // Fallback to original if no digits found (edge case)
};


async function pollBiometricLogs(): Promise<void> {
  if (isPolling) return;
  isPolling = true;

  try {
    // 1. Fetch new bio logs since last synced ID
    const newBioLogs = await db.select()
      .from(bioAttendanceLogs)
      .where(gt(bioAttendanceLogs.id, lastSyncedBioId))
      .orderBy(bioAttendanceLogs.id);

    if (newBioLogs.length === 0) {
      // Periodic heartbeat for visibility in backend console (once every 12 polls = 1 minute)
      if (Math.floor(Date.now() / 1000) % 60 < 5) {
        console.warn(`[BIO-SYNC] Heartbeat: Service active, waiting for middleware data... (Last ID: ${lastSyncedBioId})`);
      }
      return;
    }

    console.warn(`[BIO-SYNC] Found ${newBioLogs.length} new biometric log(s) since ID ${lastSyncedBioId}`);

    // Track which employee+date combos need DTR reprocessing
    const processQueue = new Map<string, { employeeId: string; dateStr: string }>();

    for (const bioLog of newBioLogs) {
      try {
        // 2. Map bio employee_id (string, potentially formatted) → system employeeId (string, numeric)
        const systemEmployeeId = convertBioIdToEmployeeId(bioLog.employeeId);

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
async function initializeLastSyncedId(): Promise<void> {
  try {
    // 1. Get the current max ID in bio_attendance_logs
    const [bioMax] = await db.select({
      maxId: sql<number>`COALESCE(MAX(id), 0)`
    }).from(bioAttendanceLogs);

    const maxBioId = bioMax?.maxId ?? 0;

    // 2. Count how many records we have in attendance_logs from BIOMETRIC source
    const [attCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(attendanceLogs)
    .where(eq(attendanceLogs.source, 'BIOMETRIC'));

    const syncedCount = attCount?.count ?? 0;

    // 3. Robust Sync Strategy:
    // If syncedCount is less than maxBioId logs we've seen (roughly), 
    // it's safer to start from a lower ID or 0 to ensure no data loss.
    
    if (syncedCount === 0 || syncedCount < maxBioId) {
        lastSyncedBioId = 0;
        console.warn(`[BIO-SYNC] Detected gap or fresh start (Bio: ${maxBioId}, Synced: ${syncedCount}). Starting full re-sync.`);
    } else {
        lastSyncedBioId = maxBioId;
        console.warn(`[BIO-SYNC] Initialized: lastSyncedBioId=${lastSyncedBioId}`);
    }

  } catch (error) {
    console.error('[BIO-SYNC] Failed to initialize lastSyncedBioId:', error);
    lastSyncedBioId = 0;
  }
}

/**
 * Get the current sync status (used by the API).
 */
export const getSyncInfo = (): { lastSyncedBioId: number; isPolling: boolean } => ({
  lastSyncedBioId,
  isPolling,
});

/**
 * Starts the background biometric polling service.
 * @param intervalMs Polling interval in milliseconds (default: 5000ms)
 */
export const startPollingService = async (intervalMs: number = 5000): Promise<void> => {
  try {
    console.warn(`[BIO-SYNC] Starting biometric sync service... Interval: ${intervalMs}ms`);

    // Initialize the last synced ID from the database
    await initializeLastSyncedId();

    // Start polling
    setInterval(pollBiometricLogs, intervalMs);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[BIO-SYNC] Failed to start polling service:', error.message);
  }
};
