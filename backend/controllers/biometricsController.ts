import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { authentication, fingerprints } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  StartEnrollmentSchema,
  GetEnrollmentStatusSchema,
  type StartEnrollmentInput,
  type GetEnrollmentStatusInput
} from '../schemas/biometricsSchema.js';
import {
  isDeviceConnected,
  getConnectedDevices,
  startEnrollment as startEnrollmentService,
  isEnrollmentInProgress
} from '../services/biometricService.js';

// ============================================================================
// Helper Functions
// ============================================================================

const handleError = (res: Response, error: Error, context: string): void => {
  console.error(`Error in ${context}:`, error);
  res.status(500).json({
    success: false,
    message: `An unexpected error occurred in ${context}.`,
    error: error.message
  });
};

// ============================================================================
// Admin Controllers (Authenticated)
// ============================================================================

/**
 * Start enrollment mode for a specific employee
 * POST /api/biometrics/enroll/start
 */
export const startEnrollment = async (
  req: Request<{}, {}, StartEnrollmentInput>, 
  res: Response
): Promise<void> => {
  try {
    const validation = StartEnrollmentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data.',
        errors: validation.error.format()
      });
      return;
    }

    const { employeeId, name, department } = validation.data;

    console.log(`[BIOMETRICS] Start enrollment request for: ${employeeId}`);

    // Check if device is connected
    if (!isDeviceConnected()) {
      res.status(503).json({
        success: false,
        message: 'No biometric device connected. Please ensure Arduino is connected via USB.'
      });
      return;
    }

    // Try to get employee info from database
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.employeeId, employeeId),
      columns: { firstName: true, lastName: true, department: true }
    });

    let fullName = name || 'Pending Registration';
    let dept = department || 'N/A';

    if (employee) {
      fullName = `${employee.firstName} ${employee.lastName}`;
      dept = employee.department || dept;
    }

    // Start enrollment via service
    const result = await startEnrollmentService(employeeId, fullName, dept);

    if (!result.success) {
      res.status(409).json({
        success: false,
        message: result.message
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      fingerprintId: result.fingerprintId
    });
  } catch (err) {
    handleError(res, err as Error, 'startEnrollment');
  }
};

/**
 * Check enrollment status for an employee
 * GET /api/biometrics/enroll/status/:employeeId
 */
export const getEnrollmentStatus = async (
  req: Request<GetEnrollmentStatusInput['params']>, 
  res: Response
): Promise<void> => {
  try {
    // Validate params
    const validation = GetEnrollmentStatusSchema.safeParse({ params: req.params });

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.error.format()
      });
      return;
    }

    const { employeeId } = validation.data.params;

    const fingerprint = await db.query.fingerprints.findFirst({
      where: eq(fingerprints.employeeId, employeeId),
      columns: { fingerprintId: true }
    });

    res.status(200).json({
      success: true,
      isEnrolled: !!fingerprint,
      fingerprintId: fingerprint ? fingerprint.fingerprintId : null
    });
  } catch (err) {
    handleError(res, err as Error, 'getEnrollmentStatus');
  }
};

/**
 * Get device connection status
 * GET /api/biometrics/device/status
 */
export const getDeviceStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const connected = isDeviceConnected();
    const devices = getConnectedDevices();
    const enrollmentInProgress = isEnrollmentInProgress();

    res.status(200).json({
      success: true,
      connected,
      enrollmentInProgress,
      devices: devices.map(d => ({
        deviceId: d.deviceId,
        ip: d.ip, // Will be 'SERIAL'
        sensorConnected: d.sensorConnected,
        lastSeen: d.lastHeartbeat.toISOString()
      }))
    });
  } catch (err) {
    handleError(res, err as Error, 'getDeviceStatus');
  }
};
