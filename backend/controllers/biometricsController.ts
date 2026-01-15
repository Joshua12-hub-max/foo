import { Request, Response } from 'express';
import db from '../db/connection.js';
import { sendCommandToDevice } from '../services/biometricService.js';
import type { RowDataPacket } from 'mysql2/promise';
import { StartEnrollmentSchema, GetEnrollmentStatusSchema } from '../schemas/biometricsSchema.js';

// ============================================================================
// Interfaces
// ============================================================================

interface EmployeeRow extends RowDataPacket {
  first_name: string;
  last_name: string;
  department: string;
}

interface FingerprintRow extends RowDataPacket {
  fingerprint_id: number;
}

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
// Controllers
// ============================================================================

/**
 * Start enrollment mode for a specific employee
 */
export const startEnrollment = async (req: Request, res: Response): Promise<void> => {
  const validation = StartEnrollmentSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ 
        success: false, 
        message: 'Invalid request data.', 
        errors: validation.error.format() 
    });
    return;
  }

  const { employeeId } = validation.data;
  console.log(`Starting enrollment for employee: ${employeeId}`);

  try {
    // Fetch Employee Details
    const [employee] = await db.query<EmployeeRow[]>(
      'SELECT first_name, last_name, department FROM authentication WHERE employee_id = ?',
      [employeeId]
    );

    if (employee.length === 0) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    const { first_name, last_name, department } = employee[0];
    const fullName = `${first_name} ${last_name}`;

    // Find a free Fingerprint ID (1-127)
    const [existingFingerprints] = await db.query<FingerprintRow[]>('SELECT fingerprint_id FROM fingerprints');
    const usedIds = new Set(existingFingerprints.map((f) => f.fingerprint_id));

    let newFingerprintId = 1;
    while (usedIds.has(newFingerprintId) && newFingerprintId <= 127) {
      newFingerprintId++;
    }

    if (newFingerprintId > 127) {
      res.status(500).json({ success: false, message: 'Fingerprint memory is full (Max 127).' });
      return;
    }

    // Send Command to Arduino
    // Format: "1\n<FINGERPRINT_ID>\n<NAME>\n<EMPLOYEE_ID>\n<DEPARTMENT>"
    const commandSequence = `1\n${newFingerprintId}\n${fullName}\n${employeeId}\n${department || 'N/A'}`;
    sendCommandToDevice(commandSequence);

    res.status(200).json({
      success: true,
      message: `Enrollment started for ID ${newFingerprintId}. Please place finger on the scanner.`
    });
  } catch (err) {
    handleError(res, err as Error, 'startEnrollment');
  }
};

/**
 * Check enrollment status for an employee
 */
export const getEnrollmentStatus = async (req: Request, res: Response): Promise<void> => {
  const validation = GetEnrollmentStatusSchema.safeParse(req);

  if (!validation.success) {
      res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: validation.error.format()
      });
      return;
  }

  const { employeeId } = validation.data.params;

  try {
    const [fingerprint] = await db.query<FingerprintRow[]>(
      'SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?',
      [employeeId]
    );

    res.status(200).json({
      success: true,
      isEnrolled: fingerprint.length > 0
    });
  } catch (err) {
    handleError(res, err as Error, 'getEnrollmentStatus');
  }
};
