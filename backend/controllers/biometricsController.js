import db from '../db/connection.js';
import { sendCommandToDevice } from '../services/biometricService.js';

// Helper function for consistent error response
const handleError = (res, error, context) => {
  console.error(`Error in ${context}:`, error);
  res.status(500).json({
    success: false,
    message: `An unexpected error occurred in ${context}.`
  });
};

/**
 * Puts the system into "enrollment mode" for a specific employee.
 * This is called by the frontend to initiate the process.
 */
export const startEnrollment = async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required." });
  }

  console.log(`Starting enrollment for employee: ${employeeId}`);

  try {
    // 1. Fetch Employee Details
    const [employee] = await db.query(
      "SELECT first_name, last_name, department FROM authentication WHERE employee_id = ?", 
      [employeeId]
    );

    if (employee.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const { first_name, last_name, department } = employee[0];
    const fullName = `${first_name} ${last_name}`;

    // 2. Find a free Fingerprint ID (1-127)
    const [existingFingerprints] = await db.query("SELECT fingerprint_id FROM fingerprints");
    const usedIds = new Set(existingFingerprints.map(f => f.fingerprint_id));
    
    let newFingerprintId = 1;
    while (usedIds.has(newFingerprintId) && newFingerprintId <= 127) {
      newFingerprintId++;
    }

    if (newFingerprintId > 127) {
      return res.status(500).json({ success: false, message: "Fingerprint memory is full (Max 127)." });
    }

    // 3. Send Command to Arduino
    // Command sequence: '1' (Enroll) -> ID -> Name -> EmpID -> Dept
    // We send it as a single simplified command string if the Arduino supports it,
    // OR we rely on the Arduino's serial buffer.
    // The Arduino code uses `readNumber()` and `readString()` which wait for newlines.
    
    // Let's send the data sequentially with newlines.
    // 1
    // <ID>
    // <Name>
    // <EmpID>
    // <Dept>
    
    const commandSequence = `1\n${newFingerprintId}\n${fullName}\n${employeeId}\n${department || 'N/A'}`;
    sendCommandToDevice(commandSequence);

    res.status(200).json({
      success: true,
      message: `Enrollment started for ID ${newFingerprintId}. Please place finger on the scanner.`
    });

  } catch (err) {
    handleError(res, err, 'startEnrollment');
  }
};

export const getEnrollmentStatus = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const [fingerprint] = await db.query("SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?", [employeeId]);
    
    return res.status(200).json({
      success: true,
      isEnrolled: fingerprint.length > 0
    });
  } catch (err) {
    handleError(res, err, 'getEnrollmentStatus');
  }
};