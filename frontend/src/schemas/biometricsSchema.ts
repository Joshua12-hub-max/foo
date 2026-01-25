/**
 * NEBR - Biometrics Schema (Frontend)
 *
 * Zod validation schemas and TypeScript types for biometrics features
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const StartEnrollmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().optional(),
  department: z.string().optional()
});

// ============================================================================
// Response Schemas
// ============================================================================

export const EnrollmentStatusResponseSchema = z.object({
  success: z.boolean(),
  isEnrolled: z.boolean(),
  fingerprintId: z.number().nullable().optional()
});

export const DeviceStatusResponseSchema = z.object({
  success: z.boolean(),
  connected: z.boolean(),
  enrollmentInProgress: z.boolean(),
  devices: z.array(
    z.object({
      deviceId: z.string(),
      ip: z.string(),
      sensorConnected: z.boolean(),
      lastSeen: z.string()
    })
  )
});

export const StartEnrollmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  fingerprintId: z.number().optional()
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type StartEnrollmentValues = z.infer<typeof StartEnrollmentSchema>;
export type EnrollmentStatusResponse = z.infer<typeof EnrollmentStatusResponseSchema>;
export type DeviceStatusResponse = z.infer<typeof DeviceStatusResponseSchema>;
export type StartEnrollmentResponse = z.infer<typeof StartEnrollmentResponseSchema>;

// Device info type for display
export interface DeviceInfo {
  deviceId: string;
  ip: string;
  sensorConnected: boolean;
  lastSeen: string;
}
