import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import db from '../db/connection.js';
import { processDailyAttendance } from './attendanceProcessor.js';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * Fingerprint mapping from database
 */
interface FingerprintRow extends RowDataPacket {
  employee_id: string;
}

/**
 * Attendance log type from database
 */
interface AttendanceLogRow extends RowDataPacket {
  type: 'IN' | 'OUT';
}

/**
 * Biometric action types from device
 */
type BiometricAction = 'ENROLL' | 'SCAN' | 'CHECK_IN' | 'CHECK_OUT' | 'ERROR';

/**
 * Biometric data structure from device
 */
interface BiometricData {
  action: BiometricAction;
  fingerprint_id: number;
  employee_id?: string;
  message?: string;
}

let port: SerialPort | undefined;
let parser: ReadlineParser | undefined;
const BAUD_RATE = 9600;

/**
 * Initialize biometric device connection
 */
export const initBiometrics = async (): Promise<void> => {
  try {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(
      (p: any) => p.manufacturer?.includes('Arduino') || p.path.includes('USB') || p.path.includes('COM')
    );

    if (!arduinoPort) {
      console.log('No Arduino found. Biometric service skipped.');
      return;
    }

    console.log(`Connecting to Biometrics Device on ${arduinoPort.path}...`);

    port = new SerialPort({ path: arduinoPort.path, baudRate: BAUD_RATE });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    let buffer = '';
    let isReading = false;

    parser.on('data', async (line: string) => {
      line = line.trim();

      if (line === '### JSON_DATA_START ###') {
        isReading = true;
        buffer = '';
        return;
      }

      if (line === '### JSON_DATA_END ###') {
        isReading = false;
        try {
          const data = JSON.parse(buffer) as BiometricData;
          await processBiometricData(data);
        } catch (e) {
          console.error('Failed to parse biometric JSON:', e);
        }
        return;
      }

      if (isReading) {
        buffer += line;
      }
    });

    port.on('open', () => {
      console.log('Biometric Serial Port Opened');
    });

    port.on('error', (err: Error) => {
      console.error('Biometric Serial Port Error: ', err.message);
    });
  } catch (err) {
    console.error('Failed to initialize biometrics:', err);
  }
};

/**
 * Process incoming biometric data from device
 */
const processBiometricData = async (data: BiometricData): Promise<void> => {
  const { action, fingerprint_id, employee_id } = data;

  try {
    if (action === 'ENROLL') {
      await db.query(
        `INSERT INTO fingerprints (fingerprint_id, employee_id) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE employee_id = ?`,
        [fingerprint_id, employee_id, employee_id]
      );
      console.log(`Fingerprint ${fingerprint_id} linked to ${employee_id}`);
    } else if (action === 'SCAN' || action === 'CHECK_IN' || action === 'CHECK_OUT') {
      const [mapping] = await db.query<FingerprintRow[]>(
        'SELECT employee_id FROM fingerprints WHERE fingerprint_id = ?',
        [fingerprint_id]
      );

      if (mapping.length === 0 && !employee_id) {
        console.log('Unknown fingerprint ID:', fingerprint_id);
        return;
      }

      const actualEmpId = mapping.length > 0 ? mapping[0].employee_id : employee_id!;

      if (action === 'SCAN') {
        await handleSmartScan(actualEmpId);
      } else if (action === 'CHECK_IN') {
        await handleClockIn(actualEmpId);
      } else if (action === 'CHECK_OUT') {
        await handleClockOut(actualEmpId);
      }
    } else if (action === 'ERROR') {
      console.error('Biometric Device Error:', data.message || 'Unknown error');
    }
  } catch (err) {
    console.error('Error in biometric service:', err);
  }
};

/**
 * Smart Toggle: Determine if IN or OUT based on last log
 */
const handleSmartScan = async (employeeId: string): Promise<void> => {
  const dateStr = new Date().toISOString().split('T')[0];

  // Get the latest log for today
  const [logs] = await db.query<AttendanceLogRow[]>(
    'SELECT type FROM attendance_logs WHERE employee_id = ? AND DATE(scan_time) = ? ORDER BY scan_time DESC LIMIT 1',
    [employeeId, dateStr]
  );

  if (logs.length === 0) {
    // No logs today -> First scan is IN
    await handleClockIn(employeeId);
  } else {
    const lastType = logs[0].type;
    if (lastType === 'IN') {
      // Last was IN -> Now OUT
      await handleClockOut(employeeId);
    } else {
      // Last was OUT -> Now IN (Re-entry)
      await handleClockIn(employeeId);
    }
  }
};

/**
 * Handle clock in action
 */
const handleClockIn = async (employeeId: string): Promise<void> => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  await db.query(
    "INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, 'IN', 'BIOMETRIC')",
    [employeeId, now]
  );

  await processDailyAttendance(employeeId, dateStr);
};

/**
 * Handle clock out action
 */
const handleClockOut = async (employeeId: string): Promise<void> => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  await db.query(
    "INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, 'OUT', 'BIOMETRIC')",
    [employeeId, now]
  );

  await processDailyAttendance(employeeId, dateStr);
};

/**
 * Send command string to biometric device
 */
export const sendCommandToDevice = (commandString: string): void => {
  if (port && port.isOpen) {
    port.write(commandString + '\n', (err) => {
      if (err) {
        console.log('Error on write: ', err.message);
        return;
      }
      console.log('Sent command to device:', commandString.trim());
    });
  } else {
    console.log('Device not connected, cannot send command:', commandString);
  }
};
