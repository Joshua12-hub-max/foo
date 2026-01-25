/**
 * NEBR - Arduino Biometric Service
 * 
 * This service handles communication with Arduino via SerialPort (USB).
 * The Arduino sends scan results and enrollment status.
 * 
 * PROTOCOL:
 * - SCAN:ID:CONFIDENCE  -> Fingerprint matched
 * - ENROLL_SUCCESS:ID   -> Enrollment complete
 * - ENROLL_FAIL:REASON  -> Enrollment failed
 * - READY               -> Device ready
 * 
 * COMMANDS TO ARDUINO:
 * - ENROLL:ID           -> Start enrollment for ID
 * - DELETE:ID           -> Delete ID
 * - DELETE_ALL          -> Delete all
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import db from '../db/connection.js';
import { processDailyAttendance } from './attendanceProcessor.js';
import { MAX_FINGERPRINT_ID } from '../constants/biometrics.js';
import type { RowDataPacket } from 'mysql2/promise';

// ============================================================================
// Interfaces
// ============================================================================

interface FingerprintRow extends RowDataPacket {
  employee_id: string;
  fingerprint_id: number;
}

interface AttendanceLogRow extends RowDataPacket {
  type: 'IN' | 'OUT';
}

interface EnrollmentRequest {
  fingerprintId: number;
  employeeId: string;
  name: string;
  department: string;
  createdAt: Date;
}

// ============================================================================
// Service Class
// ============================================================================

class BiometricService {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private isConnected = false;
  private pendingEnrollment: EnrollmentRequest | null = null;
  private lastScanMap = new Map<number, number>();
  
  // Configuration
  private readonly BAUD_RATE = 115200; // Matches Arduino code
  private readonly AUTO_RECONNECT_INTERVAL = 5000;
  private readonly SCAN_COOLDOWN_MS = 1500; // Reduced from 5s to 1.5s for better responsiveness

  constructor() {
    this.handleSerialData = this.handleSerialData.bind(this);
  }

  // ============================================================================
  // Database Helpers
  // ============================================================================

  private async getNextFingerprintId(): Promise<number> {
    const [allFingerprints] = await db.query<FingerprintRow[]>('SELECT fingerprint_id FROM fingerprints');
    const usedIds = new Set(allFingerprints.map(f => f.fingerprint_id));
    
    let id = 1;
    while (usedIds.has(id) && id <= MAX_FINGERPRINT_ID) {
      id++;
    }
    return id;
  }

  // ============================================================================
  // Serial Port Management
  // ============================================================================

  public async initialize(): Promise<void> {
    if (this.isConnected) return;

    console.log('🔌 [BIOMETRIC] Searching for Arduino...');
    
    try {
      const ports = await SerialPort.list();
      console.log('[BIOMETRIC] Available ports:', ports.map(p => `${p.path} (${p.manufacturer})`).join(', '));

      // Look for common Arduino manufacturers or just try the first available COM port that isn't strict system
      const arduinoPort = ports.find(p => 
        p.manufacturer?.includes('Arduino') || 
        p.manufacturer?.includes('wch.cn') || // CH340
        p.manufacturer?.includes('Silicon Labs') || // CP210x
        p.manufacturer?.includes('FTDI') ||
        p.manufacturer?.includes('Microsoft') // Generic Windows Drivers
      );

      if (arduinoPort) {
        console.log(`🔌 [BIOMETRIC] Found device on ${arduinoPort.path}`);
        this.connectToPort(arduinoPort.path);
      } else {
        console.log('⚠️ [BIOMETRIC] No Arduino found. Retrying in 5s...');
        setTimeout(() => this.initialize(), this.AUTO_RECONNECT_INTERVAL);
      }
    } catch (err) {
      console.error('❌ [BIOMETRIC] Port scan error:', err);
      setTimeout(() => this.initialize(), this.AUTO_RECONNECT_INTERVAL);
    }
  }

  private connectToPort(path: string) {
    try {
      this.port = new SerialPort({ path, baudRate: this.BAUD_RATE });
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.port.on('open', () => {
        console.log(`✅ [BIOMETRIC] Connected to ${path}`);
        this.isConnected = true;
        // Wait for Arduino reset
        setTimeout(async () => {
          console.log('✅ [BIOMETRIC] Ready for commands');
          await this.syncTemplatesToDevice();
        }, 3000);
      });

      this.port.on('close', () => {
        console.log('❌ [BIOMETRIC] Connection closed');
        this.isConnected = false;
        this.port = null;
        this.parser = null;
        setTimeout(() => this.initialize(), this.AUTO_RECONNECT_INTERVAL);
      });

      this.port.on('error', (err) => {
        console.error('❌ [BIOMETRIC] Serial error:', err);
        if (this.port && this.port.isOpen) this.port.close();
      });

      this.parser?.on('data', this.handleSerialData);

    } catch (err) {
      console.error(`❌ [BIOMETRIC] Failed to open ${path}:`, err);
      setTimeout(() => this.initialize(), this.AUTO_RECONNECT_INTERVAL);
    }
  }

  private async handleSerialData(data: string) {
    const line = data.trim();
    if (!line) return;

    console.log(`📥 [ARDUINO] ${line}`);

    if (line.startsWith('SCAN:')) {
      // Format: SCAN:ID:CONFIDENCE
      const parts = line.split(':');
      if (parts.length === 3) {
        const id = parseInt(parts[1]);
        const confidence = parseInt(parts[2]);
        await this.processScan(id, confidence);
      }
    } else if (line.startsWith('ENROLL_SUCCESS:')) {
      // Format: ENROLL_SUCCESS:ID
      const parts = line.split(':');
      if (parts.length === 2) {
        const id = parseInt(parts[1]);
        await this.processEnrollSuccess(id);
      }
    } else if (line.startsWith('TEMPLATE:')) {
      // Format: TEMPLATE:ID:HEX
      const parts = line.split(':');
      if (parts.length === 3) {
        const id = parseInt(parts[1]);
        const hex = parts[2];
        await this.processTemplateData(id, hex);
      }
    } else if (line.startsWith('ENROLL_FAIL:')) {
      // Format: ENROLL_FAIL:REASON
      const reason = line.split(':')[1] || 'Unknown';
      console.log(`❌ [BIOMETRIC] Enrollment failed: ${reason}`);
      this.pendingEnrollment = null;
    }
  }

  private sendCommand(cmd: string): boolean {
    if (!this.port || !this.port.isOpen) {
      console.warn('⚠️ [BIOMETRIC] Cannot send command: Device disconnected');
      return false;
    }
    console.log(`📤 [ARDUINO] Sending: ${cmd}`);
    this.port.write(cmd + '\n');
    return true;
  }

  // ============================================================================
  // Logic Handlers
  // ============================================================================

  private async processScan(fingerprintId: number, confidence: number) {
    const nowMs = Date.now();
    const lastScan = this.lastScanMap.get(fingerprintId) || 0;

    if (nowMs - lastScan < this.SCAN_COOLDOWN_MS) {
      console.log(`⏳ [BIOMETRIC] Scan ignored (Cooldown): ID ${fingerprintId}`);
      return;
    }

    // Update cooldown
    this.lastScanMap.set(fingerprintId, nowMs);

    try {
      const [rows] = await db.query<FingerprintRow[]>(
        'SELECT employee_id FROM fingerprints WHERE fingerprint_id = ?',
        [fingerprintId]
      );

      if (rows.length === 0) {
        console.log(`❓ [BIOMETRIC] Unknown scan ID: ${fingerprintId} - Not linked to any employee.`);
        // Allow immediate retry if they want to enroll it
        this.lastScanMap.delete(fingerprintId);
        return;
      }

      const employeeId = rows[0].employee_id;
      const now = new Date();
      
      // FIX: used to be toISOString() which is UTC. We want Local Time (System Time).
      // Construct YYYY-MM-DD from local components.
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Determine IN vs OUT
      const [lastLog] = await db.query<AttendanceLogRow[]>(
        `SELECT type FROM attendance_logs 
         WHERE employee_id = ? AND DATE(scan_time) = ? 
         ORDER BY scan_time DESC LIMIT 1`,
        [employeeId, today]
      );

      let mkType: 'IN' | 'OUT' = 'IN';
      if (lastLog.length > 0) {
        mkType = lastLog[0].type === 'IN' ? 'OUT' : 'IN';
      }

      await db.query(
        'INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, ?, ?)',
        [employeeId, now, mkType, 'BIOMETRIC']
      );

      console.log(`✅ [BIOMETRIC] Logged ${mkType} for ${employeeId} (Conf: ${confidence})`);

      // Trigger daily processor
      await processDailyAttendance(employeeId, today);

    } catch (err) {
      console.error('❌ [BIOMETRIC] Scan error:', err);
      // Reset cooldown on error so they can try again immediately if it was a system glitch
      this.lastScanMap.delete(fingerprintId);
    }
  }

  private async processEnrollSuccess(fingerprintId: number) {
    if (!this.pendingEnrollment) {
      console.warn(`⚠️ [BIOMETRIC] Received enroll success for ID ${fingerprintId} but no enrollment pending`);
      return;
    }

    if (this.pendingEnrollment.fingerprintId !== fingerprintId) {
      console.warn(`⚠️ [BIOMETRIC] ID Mismatch! Pending: ${this.pendingEnrollment.fingerprintId}, Recv: ${fingerprintId}`);
      return;
    }

    try {
      await db.query(
        `INSERT INTO fingerprints (fingerprint_id, employee_id) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE employee_id = ?`,
        [fingerprintId, this.pendingEnrollment.employeeId, this.pendingEnrollment.employeeId]
      );
      console.log(`✅ [BIOMETRIC] Enrollment recorded for ${this.pendingEnrollment.employeeId} (ID ${fingerprintId}). Waiting for template...`);
      // DO NOT NULLIFY pendingEnrollment YET, wait for TEMPLATE
    } catch (err) {
      console.error('❌ [BIOMETRIC] DB Error on enroll:', err);
    }
  }

  private async processTemplateData(fingerprintId: number, hexData: string) {
    try {
      await db.query(
        'UPDATE fingerprints SET template = ? WHERE fingerprint_id = ?',
        [hexData, fingerprintId]
      );
      
      const empId = this.pendingEnrollment?.employeeId || 'Unknown';
      console.log(`✅ [BIOMETRIC] Fingerprint template stored for ${empId} (ID ${fingerprintId})`);
      
      this.pendingEnrollment = null; // Finally clear it
    } catch (err) {
      console.error('❌ [BIOMETRIC] DB Error on template:', err);
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  public async startEnrollment(
    employeeId: string, 
    name: string, 
    department: string
  ): Promise<{ success: boolean; message: string; fingerprintId?: number }> {
    if (!this.isConnected) {
      return { success: false, message: 'Biometric device not connected' };
    }
    if (this.pendingEnrollment) {
      return { success: false, message: 'Enrollment already in progress' };
    }

    try {
      // Check existing
      const [existing] = await db.query<FingerprintRow[]>(
        'SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?', 
        [employeeId]
      );

      let targetId: number;
      if (existing.length > 0) {
        targetId = existing[0].fingerprint_id;
        console.log(`[BIOMETRIC] Re-enrolling ID ${targetId} for ${employeeId}`);
      } else {
        targetId = await this.getNextFingerprintId();
        if (targetId > MAX_FINGERPRINT_ID) return { success: false, message: 'Device memory full' };
      }

      this.pendingEnrollment = {
        fingerprintId: targetId,
        employeeId,
        name,
        department,
        createdAt: new Date()
      };

      // Send command to Arduino
      // Protocol: ENROLL:ID
      const sent = this.sendCommand(`ENROLL:${targetId}`);
      if (!sent) {
        this.pendingEnrollment = null;
        return { success: false, message: 'Failed to send command' };
      }

      return { 
        success: true, 
        message: 'Enrollment started. Please follow device instructions.', 
        fingerprintId: targetId 
      };

    } catch (err) {
      console.error('❌ [BIOMETRIC] Start enroll error:', err);
      return { success: false, message: 'Server error' };
    }
  }

  public async deleteFingerprint(fingerprintId: number): Promise<void> {
    try {
      await db.query('DELETE FROM fingerprints WHERE fingerprint_id = ?', [fingerprintId]);
      this.sendCommand(`DELETE:${fingerprintId}`);
    } catch (err) {
      console.error('❌ Error deleting fingerprint:', err);
    }
  }

  public async clearAllFingerprints(): Promise<void> {
    try {
      await db.query('DELETE FROM fingerprints');
      this.sendCommand('DELETE_ALL');
    } catch (err) {
      console.error('❌ Error clearing all fingerprints:', err);
    }
  }

  public isDeviceConnected(): boolean {
    return this.isConnected;
  }

  public getConnectedDevices() {
    if (!this.isConnected) return [];
    return [{ 
      deviceId: 'ARDUINO', 
      ip: 'SERIAL', 
      sensorConnected: true, 
      lastHeartbeat: new Date() 
    }];
  }

  public isEnrollmentInProgress(): boolean {
    return this.pendingEnrollment !== null;
  }

  public getEnrollmentStatus() {
    return {
      inProgress: this.pendingEnrollment !== null,
      current: this.pendingEnrollment
    };
  }

  public async syncTemplatesToDevice(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const [rows] = await db.query<FingerprintRow[]>(
        'SELECT fingerprint_id, template FROM fingerprints WHERE template IS NOT NULL'
      );
      
      if (rows.length === 0) {
        console.log('[BIOMETRIC] No templates to sync.');
        return;
      }

      console.log(`[BIOMETRIC] Syncing ${rows.length} templates to device...`);
      for (const row of rows) {
        // Send as STORE_TEMPLATE:ID:HEX
        this.sendCommand(`STORE_TEMPLATE:${row.fingerprint_id}:${(row as any).template}`);
        // Small delay between commands to not flood Arduino
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log('[BIOMETRIC] Sync complete.');
    } catch (err) {
      console.error('❌ [BIOMETRIC] Sync error:', err);
    }
  }

  public async sendCommandToDevice(cmd: string) {
    return this.sendCommand(cmd);
  }
}

// Export singleton instance
export const biometricService = new BiometricService();

// Export legacy functions for compatibility
export const initBiometrics = () => biometricService.initialize();
export const startEnrollment = (employeeId: string, name: string, department: string) => biometricService.startEnrollment(employeeId, name, department);
export const deleteFingerprint = (fingerprintId: number) => biometricService.deleteFingerprint(fingerprintId);
export const clearAllFingerprints = () => biometricService.clearAllFingerprints();
export const isDeviceConnected = () => biometricService.isDeviceConnected();
export const getConnectedDevices = () => biometricService.getConnectedDevices();
export const isEnrollmentInProgress = () => biometricService.isEnrollmentInProgress();
export const getEnrollmentStatus = () => biometricService.getEnrollmentStatus();
export const sendCommandToDevice = (cmd: string) => biometricService.sendCommandToDevice(cmd);
