/**
 * NEBR - Biometrics Schemas
 * 
 * Zod validation schemas for biometric operations
 */

import { z } from 'zod';
import { MAX_FINGERPRINT_ID } from '../constants/biometrics.js';

// ============================================================================
// Admin Schemas
// ============================================================================

/**
 * Start enrollment request from admin
 */
export const StartEnrollmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().optional(),
  department: z.string().optional()
});

export type StartEnrollmentInput = z.infer<typeof StartEnrollmentSchema>;

/**
 * Get enrollment status request
 */
export const GetEnrollmentStatusSchema = z.object({
  params: z.object({
    employeeId: z.string().min(1, 'Employee ID is required')
  })
});

export type GetEnrollmentStatusInput = z.infer<typeof GetEnrollmentStatusSchema>;

// ============================================================================
// ESP32 Device Schemas
// ============================================================================

/**
 * Device heartbeat schema
 */
export const DeviceHeartbeatSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  ip: z.string().min(1, 'IP address is required'),
  sensorConnected: z.boolean()
});

export type DeviceHeartbeatInput = z.infer<typeof DeviceHeartbeatSchema>;

/**
 * Device scan submission schema
 */
export const DeviceScanSchema = z.object({
  fingerprintId: z.number().int().min(1).max(MAX_FINGERPRINT_ID),
  confidence: z.number().int().min(0).max(300).optional().default(100),
  deviceId: z.string().min(1, 'Device ID is required')
});

export type DeviceScanInput = z.infer<typeof DeviceScanSchema>;

/**
 * Device enrollment completion schema
 */
export const DeviceEnrollCompleteSchema = z.object({
  fingerprintId: z.number().int().min(1).max(MAX_FINGERPRINT_ID),
  employeeId: z.string().min(1, 'Employee ID is required'),
  success: z.boolean(),
  status: z.string().min(1, 'Status is required'),
  deviceId: z.string().optional()
});

export type DeviceEnrollCompleteInput = z.infer<typeof DeviceEnrollCompleteSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Enrollment status response
 */
export interface EnrollmentStatusResponse {
  success: boolean;
  isEnrolled: boolean;
  fingerprintId?: number;
}

/**
 * Device status response
 */
export interface DeviceStatusResponse {
  success: boolean;
  connected: boolean;
  enrollmentInProgress: boolean;
  devices: {
    deviceId: string;
    ip: string;
    sensorConnected: boolean;
    lastSeen: string;
  }[];
}

/**
 * Pending enrollment response (for ESP32 polling)
 */
export interface PendingEnrollmentResponse {
  pending: boolean;
  fingerprintId?: number;
  employeeId?: string;
  name?: string;
  department?: string;
}

/**
 * Scan result response
 */
export interface ScanResultResponse {
  success: boolean;
  type?: 'IN' | 'OUT';
  employeeId?: string;
  message: string;
}
