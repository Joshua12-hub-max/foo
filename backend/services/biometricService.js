import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import db from '../db/connection.js';

let port;
let parser;
const BAUD_RATE = 9600; // Match Arduino code

export const initBiometrics = async () => {
  try {
    // Auto-detect Arduino (this is a bit naive, usually look for specific manufacturer or ask user)
    // For now, we'll list ports and pick the first COM port that looks like an Arduino or just the first one.
    // In production, put this in .env
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(p => p.manufacturer?.includes('Arduino') || p.path.includes('USB'));
    
    if (!arduinoPort) {
      console.log('No Arduino found. Biometric service skipped.');
      return;
    }

    console.log(`Connecting to Biometrics Device on ${arduinoPort.path}...`);
    
    port = new SerialPort({ path: arduinoPort.path, baudRate: BAUD_RATE });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    let buffer = '';
    let isReading = false;

    parser.on('data', async (line) => {
      line = line.trim();
      
      if (line === '### JSON_DATA_START ###') {
        isReading = true;
        buffer = '';
        return;
      }
      
      if (line === '### JSON_DATA_END ###') {
        isReading = false;
        try {
          const data = JSON.parse(buffer);
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

    port.on('error', (err) => {
      console.error('Biometric Serial Port Error: ', err.message);
    });

  } catch (err) {
    console.error('Failed to initialize biometrics:', err);
  }
};

const processBiometricData = async (data) => {
  console.log('Processing Biometric Data:', data);
  const { action, fingerprint_id, employee_id, timestamp } = data;

  try {
    if (action === 'ENROLL') {
      // Map fingerprint ID to employee ID
      await db.query(
        `INSERT INTO fingerprints (fingerprint_id, employee_id) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE employee_id = ?`,
        [fingerprint_id, employee_id, employee_id]
      );
      console.log(`Fingerprint ${fingerprint_id} linked to ${employee_id}`);
    } 
    else if (action === 'CHECK_IN' || action === 'CHECK_OUT') {
      // Get employee_id from fingerprint_id if not provided (though Arduino sends it if mapped)
      // The Arduino code sends employee_id, assuming it stored it during enroll.
      // We should double check or rely on the Arduino's data.
      // To be safe, let's query our DB map.
      
      const [mapping] = await db.query("SELECT employee_id FROM fingerprints WHERE fingerprint_id = ?", [fingerprint_id]);
      
      if (mapping.length === 0 && !employee_id) {
        console.log('Unknown fingerprint ID:', fingerprint_id);
        return;
      }
      
      const actualEmpId = mapping.length > 0 ? mapping[0].employee_id : employee_id;
      
      if (action === 'CHECK_IN') {
        await handleClockIn(actualEmpId);
      } else {
        await handleClockOut(actualEmpId);
      }
    }
  } catch (err) {
    console.error('Database error in biometric service:', err);
  }
};

const handleClockIn = async (employeeId) => {
  const date = new Date().toISOString().split('T')[0];
  const now = new Date(); // Use server time for security, or convert timestamp if needed
  
  // 1. Check if already clocked in
  const [existing] = await db.query(
    "SELECT * FROM daily_time_records WHERE employee_id = ? AND date = ?",
    [employeeId, date]
  );

  if (existing.length > 0 && existing[0].time_in) {
    console.log(`User ${employeeId} already clocked in.`);
    return;
  }

  // 2. Determine Status (Present vs Late)
  let status = 'Present';
  let lateMinutes = 0;

  // Fetch Schedule
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];
  
  const [schedule] = await db.query(
    "SELECT * FROM schedules WHERE employee_id = ? AND day_of_week = ?",
    [employeeId, dayName]
  );

  if (schedule.length > 0) {
    const startTime = new Date(`${date}T${schedule[0].start_time}`);
    const gracePeriod = 15 * 60000; // 15 minutes in ms
    
    if (now.getTime() > (startTime.getTime() + gracePeriod)) {
      status = 'Late';
      lateMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
    }
  }

  // 3. Insert Record
  await db.query(
    `INSERT INTO daily_time_records 
    (employee_id, date, time_in, status, late_minutes) 
    VALUES (?, ?, ?, ?, ?)`,
    [employeeId, date, now, status, lateMinutes]
  );
  console.log(`Clock In recorded for ${employeeId}: ${status}`);
};

const handleClockOut = async (employeeId) => {
  const date = new Date().toISOString().split('T')[0];
  const now = new Date();

  await db.query(
    "UPDATE daily_time_records SET time_out = ? WHERE employee_id = ? AND date = ? AND time_out IS NULL",
    [now, employeeId, date]
  );
  console.log(`Clock Out recorded for ${employeeId}`);
};
