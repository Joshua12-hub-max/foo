import { db } from '../db/index.js';
import { bioAttendanceLogs, attendanceLogs } from '../db/schema.js';
import { gt, eq, sql } from 'drizzle-orm';
import { processDailyAttendance } from './attendanceProcessor.js';
import { normalizeIdJs } from '../utils/idUtils.js';

// Track the last synced bio_attendance_logs ID (monotonic, avoids clock drift)
let lastSyncedBioId = 0;
let isPolling = false;
let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Normalizes card types from the biometric middleware to the system's strict 'IN'/'OUT' enum.
 */
const normalizeCardType = (cardType: string | null | undefined): 'IN' | 'OUT' => {
  if (!cardType) return 'IN';
  const upper = cardType.toUpperCase().trim();
  // Handle common variations from different middleware/hardware versions
  if (upper === 'IN' || upper === '0' || upper === 'CHECK-IN' || upper === 'ENTRY') return 'IN';
  if (upper === 'OUT' || upper === '1' || upper === 'CHECK-OUT' || upper === 'EXIT') return 'OUT';
  return 'IN'; // Default fallback
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
      if (Math.floor(Date.now() / 1000) % 60 < 5) {
        console.warn(`[BIO-SYNC] Heartbeat: Service active, waiting for middleware data... (Last BioID: ${lastSyncedBioId})`);
      }
      return;
    }

    console.warn(`[BIO-SYNC] Found ${newBioLogs.length} new biometric log(s) since BioID ${lastSyncedBioId}`);

    const processQueue = new Map<string, { employeeId: string; dateStr: string }>();

    for (const bioLog of newBioLogs) {
      try {
        // 100% PRECISION: Use centralized normalization to 'Emp-XXX'
        const systemEmployeeId = normalizeIdJs(bioLog.employeeId);
        
        // 100% RELIABILITY: Normalize type to match MySQL Enum
        const normalizedType = normalizeCardType(bioLog.cardType);

        // 100% PRECISION: Ensure logDate and logTime are combined correctly
        const rawDate = String(bioLog.logDate);
        const dateParts = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const scanTime = `${dateParts} ${bioLog.logTime}`;
        
        await db.insert(attendanceLogs).values({
          employeeId: systemEmployeeId,
          scanTime: scanTime,
          type: normalizedType,
          source: 'BIOMETRIC',
          bioLogId: bioLog.id // 100% TRACKING
        }).onDuplicateKeyUpdate({
          set: { 
              employeeId: systemEmployeeId,
              bioLogId: bioLog.id // Ensure we track it even if scanTime already exists
          } 
        });

        const key = `${systemEmployeeId}:${dateParts}`;
        if (!processQueue.has(key)) {
          processQueue.set(key, { employeeId: systemEmployeeId, dateStr: dateParts });
        }
      } catch (err) {
        console.error(`[BIO-SYNC] Failed to sync bio log ID ${bioLog.id}:`, err);
      }
    }

    lastSyncedBioId = newBioLogs[newBioLogs.length - 1].id;

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
 * Initialize lastSyncedBioId by checking the max ID already synced in attendance_logs.
 * This is 100% reliable compared to heuristic counts.
 */
async function initializeLastSyncedId(): Promise<void> {
  try {
    const [attMax] = await db.select({
      maxBioId: sql<number>`COALESCE(MAX(bio_log_id), 0)`
    }).from(attendanceLogs);

    lastSyncedBioId = attMax?.maxBioId ?? 0;
    console.warn(`[BIO-SYNC] Initialized: lastSyncedBioId=${lastSyncedBioId} (Reliable tracking from database)`);

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
 */
export const startPollingService = async (intervalMs: number = 5000): Promise<void> => {
  try {
    console.warn(`[BIO-SYNC] Starting biometric sync service... Interval: ${intervalMs}ms`);

    await initializeLastSyncedId();

    if (!pollingInterval) {
      pollingInterval = setInterval(pollBiometricLogs, intervalMs);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[BIO-SYNC] Failed to start polling service:', error.message);
  }
};

export const stopPollingService = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.warn('[BIO-SYNC] Polling service stopped.');
  }
};
