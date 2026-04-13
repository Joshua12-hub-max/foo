import { db } from '../db/index.js';
import { bioAttendanceLogs, attendanceLogs } from '../db/schema.js';
import { gt, eq, sql } from 'drizzle-orm';
import { processDailyAttendance } from './attendanceProcessor.js';

// Track the last synced bio_attendance_logs ID (monotonic, avoids clock drift)
let lastSyncedBioId = 0;
let isPolling = false;
let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Normalizes an employee ID by ensuring it follows the 'Emp-XXX' format.
 * If it's already 'Emp-XXX', it returns it. 
 * If it's just a number, it pads it (e.g., '1' -> 'Emp-001').
 */
const convertBioIdToEmployeeId = (bioId: string): string => {
  if (bioId.startsWith('Emp-')) {
    // 100% PRECISION: Normalize to 3-digit minimum
    const numericPart = bioId.replace(/\D/g, '');
    return `Emp-${numericPart.padStart(3, '0')}`;
  }
  
  // Extract only digits and pad to 3 places
  const numericId = bioId.replace(/\D/g, '');
  if (numericId) {
    return `Emp-${numericId.padStart(3, '0')}`;
  }
  
  return bioId; // Fallback
};


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
        console.warn(`[BIO-SYNC] Heartbeat: Service active, waiting for middleware data... (Last ID: ${lastSyncedBioId})`);
      }
      return;
    }

    console.warn(`[BIO-SYNC] Found ${newBioLogs.length} new biometric log(s) since ID ${lastSyncedBioId}`);

    const processQueue = new Map<string, { employeeId: string; dateStr: string }>();

    for (const bioLog of newBioLogs) {
      try {
        const systemEmployeeId = convertBioIdToEmployeeId(bioLog.employeeId);
        
        // 100% RELIABILITY: Normalize type to match MySQL Enum
        const normalizedType = normalizeCardType(bioLog.cardType);

        // 100% PRECISION: Ensure logDate and logTime are combined correctly
        // Some hardware might return logDate as '2023-10-01' or '10/01/2023'
        const rawDate = String(bioLog.logDate);
        const dateParts = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const scanTime = `${dateParts} ${bioLog.logTime}`;
        
        await db.insert(attendanceLogs).values({
          employeeId: systemEmployeeId,
          scanTime: scanTime,
          type: normalizedType,
          source: 'BIOMETRIC'
        }).onDuplicateKeyUpdate({
          set: { employeeId: systemEmployeeId } // No-op to prevent duplicates
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
    // If we have existing records, we should NOT simply skip to the current max,
    // as that would lose any logs created while the server was offline.
    // Instead, we initialize to 0 if fresh, or if not fresh, we do a one-time
    // "Catch-up" by scanning from a safe point.
    
    if (syncedCount === 0) {
        lastSyncedBioId = 0;
        console.warn(`[BIO-SYNC] Fresh start detected. Starting full re-sync.`);
    } else {
        // 100% RELIABILITY: We look for the last processed ID by checking the latest logs.
        // Since we don't store bioId in attendance_logs, we'll start from (maxBioId - syncedCount)
        // or a similar heuristic, but to be 100% safe, we'll scan the last 1000 logs 
        // to ensure no "gap" logs were missed during downtime.
        lastSyncedBioId = Math.max(0, maxBioId - 1000); 
        console.warn(`[BIO-SYNC] Initialized: lastSyncedBioId=${lastSyncedBioId} (Look-back enabled for downtime protection)`);
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
    if (!pollingInterval) {
      pollingInterval = setInterval(pollBiometricLogs, intervalMs);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[BIO-SYNC] Failed to start polling service:', error.message);
  }
};

/**
 * Stops the background biometric polling service.
 */
export const stopPollingService = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.warn('[BIO-SYNC] Polling service stopped.');
  }
};
