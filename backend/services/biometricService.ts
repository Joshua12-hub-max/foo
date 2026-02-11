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
import { db } from '../db/index.js';
import { fingerprints, attendanceLogs, authentication } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { processDailyAttendance } from './attendanceProcessor.js';
import { MAX_FINGERPRINT_ID } from '../constants/biometrics.js';

// ============================================================================
// Interfaces
// ============================================================================

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
    const allFingerprints = await db.select({ fingerprintId: fingerprints.fingerprintId }).from(fingerprints);
    const usedIds = new Set(allFingerprints.map(f => f.fingerprintId));
    
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
        p.manufacturer?.toLowerCase().includes('arduino') || 
        p.manufacturer?.toLowerCase().includes('wch.cn') || // CH340
        p.manufacturer?.toLowerCase().includes('silicon labs') || // CP210x
        p.manufacturer?.toLowerCase().includes('ftdi') ||
        p.manufacturer?.toLowerCase().includes('microsoft') || // Generic Windows Drivers
        (p as any).friendlyName?.toLowerCase().includes('usb serial device')
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
        console.log(`[BIOMETRIC] Connected to ${path}`);
        this.isConnected = true;
        // Wait for Arduino reset
        setTimeout(async () => {
          console.log('[BIOMETRIC] Ready for commands');
          await this.syncTemplatesToDevice();
        }, 3000);
      });

      this.port.on('close', () => {
        console.log('[BIOMETRIC] Connection closed');
        this.isConnected = false;
        this.port = null;
        this.parser = null;
        setTimeout(() => this.initialize(), this.AUTO_RECONNECT_INTERVAL);
      });

      this.port.on('error', (err) => {
        console.error('[BIOMETRIC] Serial error:', err);
        if (this.port && this.port.isOpen) this.port.close();
      });

      this.parser?.on('data', this.handleSerialData);

    } catch (err) {
      console.error(`[BIOMETRIC] Failed to open ${path}:`, err);
      setTimeout(() => this.initialize(), this.AUTO_RECONNECT_INTERVAL);
    }
  }

  private async handleSerialData(data: string) {
    const line = data.trim();
    if (!line) return;

    // Log all incoming data for debugging
    if (line.startsWith('DEBUG:')) {
      console.log(`[ARDUINO-DEBUG] ${line}`);
      return;
    }
    
    if (line.startsWith('SCAN_FAIL:')) {
      console.log(`[BIOMETRIC] ${line}`);
      return;
    }
    
    if (line.startsWith('STORE_FAIL:')) {
      console.log(`[BIOMETRIC] Template store failed: ${line}`);
      return;
    }
    
    if (line.startsWith('TEMPLATE_COUNT:')) {
      console.log(`[BIOMETRIC] ${line}`);
      return;
    }

    console.log(`[ARDUINO] ${line}`);

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
      console.log(`[BIOMETRIC] Enrollment failed: ${reason}`);
      this.pendingEnrollment = null;
    } else if (line !== 'READY') {
      console.log(`[BIOMETRIC] Unhandled message: ${line}`);
    }
  }

  private sendCommand(cmd: string): boolean {
    if (!this.port || !this.port.isOpen) {
      console.warn('[BIOMETRIC] Cannot send command: Device disconnected');
      return false;
    }
    console.log(`[ARDUINO] Sending: ${cmd}`);
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
      console.log(`[BIOMETRIC] Scan ignored (Cooldown): ID ${fingerprintId}`);
      return;
    }

    // Update cooldown
    this.lastScanMap.set(fingerprintId, nowMs);

    try {
      const fingerprint = await db.query.fingerprints.findFirst({
        where: eq(fingerprints.fingerprintId, fingerprintId),
        columns: { employeeId: true }
      });

      if (!fingerprint) {
        console.warn(`[BIOMETRIC] Unknown scan ID: ${fingerprintId} - Not linked to any employee.`);
        // Allow immediate retry if they want to enroll it
        this.lastScanMap.delete(fingerprintId);
        return;
      }

      const employeeId = fingerprint.employeeId;
      console.log(`[BIOMETRIC] Match found: ID ${fingerprintId} -> Employee ${employeeId}`);
      
      const now = new Date();
      
      // FIX: used to be toISOString() which is UTC. We want Local Time (System Time).
      // Construct YYYY-MM-DD from local components.
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Determine IN vs OUT
      const lastLog = await db.query.attendanceLogs.findFirst({
        where: and(
          eq(attendanceLogs.employeeId, employeeId),
          eq(sql`DATE(${attendanceLogs.scanTime})`, today)
        ),
        orderBy: desc(attendanceLogs.scanTime)
      });

      let mkType: 'IN' | 'OUT' = 'IN';
      if (lastLog) {
        mkType = lastLog.type === 'IN' ? 'OUT' : 'IN';
      }

      // Format YYYY-MM-DD HH:mm:ss for MySQL DATETIME
      const mysqlScanTime = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

      await db.insert(attendanceLogs).values({
        employeeId,
        scanTime: mysqlScanTime,
        type: mkType,
        source: 'BIOMETRIC'
      });

      console.log(`[BIOMETRIC] Logged ${mkType} for ${employeeId} (Conf: ${confidence}) at ${mysqlScanTime}`);

      // Trigger daily processor
      await processDailyAttendance(employeeId, today);

    } catch (err) {
      console.error('[BIOMETRIC] Scan error:', err);
      // Reset cooldown on error so they can try again immediately if it was a system glitch
      this.lastScanMap.delete(fingerprintId);
    }
  }

  private async processEnrollSuccess(fingerprintId: number) {
    if (!this.pendingEnrollment) {
      console.warn(`[BIOMETRIC] Received enroll success for ID ${fingerprintId} but no enrollment pending`);
      return;
    }

    if (this.pendingEnrollment.fingerprintId !== fingerprintId) {
      console.warn(`[BIOMETRIC] ID Mismatch! Pending: ${this.pendingEnrollment.fingerprintId}, Recv: ${fingerprintId}`);
      return;
    }

    try {
      await db.insert(fingerprints).values({
        fingerprintId: fingerprintId,
        employeeId: this.pendingEnrollment.employeeId
      }).onDuplicateKeyUpdate({
        set: { employeeId: this.pendingEnrollment.employeeId }
      });

      console.log(`[BIOMETRIC] Enrollment recorded for ${this.pendingEnrollment.employeeId} (ID ${fingerprintId}). Waiting for template...`);
      // DO NOT NULLIFY pendingEnrollment YET, wait for TEMPLATE
    } catch (err) {
      console.error('[BIOMETRIC] DB Error on enroll:', err);
    }
  }

  private async processTemplateData(fingerprintId: number, hexData: string) {
    try {
      await db.update(fingerprints)
        .set({ template: hexData })
        .where(eq(fingerprints.fingerprintId, fingerprintId));
      
      const empId = this.pendingEnrollment?.employeeId || 'Unknown';
      console.log(`[BIOMETRIC] Fingerprint template stored for ${empId} (ID ${fingerprintId})`);
      
      this.pendingEnrollment = null; // Finally clear it
    } catch (err) {
      console.error('[BIOMETRIC] DB Error on template:', err);
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
      const existing = await db.query.fingerprints.findFirst({
        where: eq(fingerprints.employeeId, employeeId),
        columns: { fingerprintId: true }
      });

      let targetId: number;
      if (existing) {
        targetId = existing.fingerprintId;
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
      console.error('[BIOMETRIC] Start enroll error:', err);
      return { success: false, message: 'Server error' };
    }
  }

  public async deleteFingerprint(fingerprintId: number): Promise<void> {
    try {
      await db.delete(fingerprints).where(eq(fingerprints.fingerprintId, fingerprintId));
      this.sendCommand(`DELETE:${fingerprintId}`);
    } catch (err) {
      console.error('Error deleting fingerprint:', err);
    }
  }

  public async clearAllFingerprints(): Promise<void> {
    try {
      await db.delete(fingerprints);
      this.sendCommand('DELETE_ALL');
    } catch (err) {
      console.error('Error clearing all fingerprints:', err);
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

  // ============================================================================
  // Template Parsing Helpers
  // ============================================================================
  
  private parseTemplatePackets(hexData: string): Buffer | null {
    // The stored template matches the R307/R305 data packet format:
    // [Header 2B][Addr 4B][PID 1B][Len 2B][Data...][Sum 2B]
    // We need to extract just the Data portions to reconstruct the 512-byte template.
    
    try {
      const buffer = Buffer.from(hexData, 'hex');
      let offset = 0;
      const extractedData: number[] = [];
      
      while (offset < buffer.length - 8) { // Minimum packet remaining
        // Check Header EF 01
        if (buffer[offset] !== 0xEF || buffer[offset+1] !== 0x01) {
          offset++;
          continue;
        }
        
        // Skip Header(2) + Addr(4) = 6 bytes
        // PID is at offset + 6
        // Length is at offset + 7 (High) and + 8 (Low)
        const len = (buffer[offset+7] << 8) | buffer[offset+8];
        const dataLen = len - 2; // Length includes checksum (2 bytes)
        
        // Data starts at offset + 9
        const dataStart = offset + 9;
        
        for (let i = 0; i < dataLen; i++) {
          if (dataStart + i < buffer.length) {
            extractedData.push(buffer[dataStart + i]);
          }
        }
        
        // Move to next packet
        // Packet size = 9 header/meta + dataLen + 2 checksum? 
        // Actually Packet overhead = Header(2)+Addr(4)+PID(1)+Len(2)+Sum(2) = 11 bytes + Data
        // But Len DOES include Sum. So Len = DataLen + 2.
        // Total jump = 9 + Len.
        offset += (9 + len);
      }
      
      if (extractedData.length !== 512) {
        console.warn(`[BIOMETRIC] Parsed template length mismatch: ${extractedData.length} (Expected 512)`);
        // If it's close, maybe it's fine? No, must be exact for R307.
        // If it's > 512, truncate. If < 512, pad?
        if (extractedData.length > 512) {
           return Buffer.from(extractedData.slice(0, 512));
        }
        return null;
      }
      
      return Buffer.from(extractedData);
      
    } catch (err) {
      console.error('Error parsing template hex:', err);
      return null;
    }
  }

  public async syncTemplatesToDevice(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const rows = await db.select({
        fingerprintId: fingerprints.fingerprintId,
        template: fingerprints.template
      })
      .from(fingerprints)
      .where(sql`${fingerprints.template} IS NOT NULL`);
      
      if (rows.length === 0) {
        console.log('[BIOMETRIC] No templates to sync.');
        return;
      }

      console.log(`[BIOMETRIC] Syncing ${rows.length} templates to device...`);
      
      // Clear device first to ensure consistency with DB
      this.sendCommand('DELETE_ALL');
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (const row of rows) {
        const hexTemplate = row.template;
        if (!hexTemplate || hexTemplate.length < 100) continue;
        
        const rawData = this.parseTemplatePackets(hexTemplate);
        if (!rawData) {
           console.error(`[BIOMETRIC] Failed to parse template for ID ${row.fingerprintId}. Skipping.`);
           continue;
        }

        console.log(`[BIOMETRIC] Uploading ID ${row.fingerprintId} (${rawData.length} bytes)...`);
        
        // 1. Send Upload Command
        this.sendCommand(`UPLOAD:${row.fingerprintId}`);
        
        // 2. Wait for READY_FOR_DATA
        // We need a temporary one-time listener or promise
        const ready = await this.waitForSerialMessage('READY_FOR_DATA', 2000);
        
        if (!ready) {
           console.error(`[BIOMETRIC] Device did not acknowledge upload for ID ${row.fingerprintId}`);
           continue;
        }
        
        // 3. Send Raw Data
        if (this.port) {
           this.port.write(rawData);
           this.port.drain(); // Wait for OS buffer to flush
        }
        
        // 4. Wait for confirmation (STORE_SUCCESS or STORE_FAIL)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Give Arduino time to write to flash
      }
      console.log('[BIOMETRIC] Sync complete.');
    } catch (err) {
      console.error('[BIOMETRIC] Sync error:', err);
    }
  }
  
  private waitForSerialMessage(prefix: string, timeoutMs: number): Promise<boolean> {
     return new Promise((resolve) => {
        if (!this.parser) { resolve(false); return; }
        
        let solved = false;
        const handler = (data: string) => {
           if (data.trim().startsWith(prefix)) {
              if (!solved) {
                 solved = true;
                 resolve(true);
                 this.parser?.removeListener('data', handler);
              }
           }
        };
        
        this.parser.on('data', handler);
        
        setTimeout(() => {
           if (!solved) {
              solved = true;
              this.parser?.removeListener('data', handler);
              resolve(false);
           }
        }, timeoutMs);
     });
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
