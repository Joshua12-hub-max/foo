import db from '../db/connection.js';

// Helper function for consistent error response
const handleError = (res, error, context) => {
  console.error(`Error in ${context}:`, error);
  res.status(500).json({ 
    success: false, 
    message: `An unexpected error occurred in ${context}.`, 
    data: null 
  });
};

export const clockIn = async (req, res) => {
  const { employeeId, time } = req.body;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required.", data: null });
  }

  try {
    const date = new Date().toISOString().split('T')[0];
    const scanTime = time ? new Date(time) : new Date();
    
    const [existingDTR] = await db.query(
      "SELECT * FROM daily_time_records WHERE employee_id = ? AND date = ?",
      [employeeId, date]
    );

    if (existingDTR.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: "Already clocked in for today.",
        data: { timeIn: existingDTR[0].time_in }
      });
    }

    await db.query(
      "INSERT INTO daily_time_records (employee_id, date, time_in, status) VALUES (?, ?, ?, 'Present')",
      [employeeId, date, scanTime]
    );

    return res.status(201).json({ 
      success: true, 
      message: "Clock in successful.",
      data: { timeIn: scanTime }
    });

  } catch (err) {
    handleError(res, err, 'clockIn');
  }
};

export const clockOut = async (req, res) => {
  const { employeeId, time } = req.body;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required.", data: null });
  }

  try {
    const date = new Date().toISOString().split('T')[0];
    const scanTime = time ? new Date(time) : new Date();
    
    const [result] = await db.query(
      "UPDATE daily_time_records SET time_out = ? WHERE employee_id = ? AND date = ? AND time_out IS NULL",
      [scanTime, employeeId, date]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "No active clock-in found for today to clock out.", data: null });
    }

    return res.status(200).json({ 
        success: true, 
        message: "Clock out successful.",
        data: { timeOut: scanTime }
    });

  } catch (err) {
    handleError(res, err, 'clockOut');
  }
};

export const getLogs = async (req, res) => {
  const { employeeId } = req.query;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required.", data: null });
  }

  try {
    const [logs] = await db.query("SELECT * FROM daily_time_records WHERE employee_id = ? ORDER BY date DESC LIMIT 50", [employeeId]);
    
    return res.status(200).json({
      success: true,
      message: logs.length > 0 ? "Logs retrieved successfully." : "No logs found.",
      data: logs
    });

  } catch (err) {
    handleError(res, err, 'getLogs');
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT dtr.*, CONCAT(a.first_name, ' ', a.last_name) as name, a.department 
       FROM daily_time_records dtr
       JOIN authentication a ON dtr.employee_id = a.employee_id
       ORDER BY dtr.updated_at DESC LIMIT 20`
    );
    
    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    handleError(res, err, 'getRecentActivity');
  }
};

export const getTodayStatus = async (req, res) => {
  const { employeeId } = req.query;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required.", data: null });
  }
    
  try {
    const date = new Date().toISOString().split('T')[0];

    const [dtr] = await db.query(
        "SELECT status, time_in, time_out FROM daily_time_records WHERE employee_id = ? AND date = ?",
        [employeeId, date]
    );

    if (dtr.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Today's status retrieved successfully.",
        data: {
            status: dtr[0].status,
            timeIn: dtr[0].time_in,
            timeOut: dtr[0].time_out
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Not clocked in today.",
        data: { status: 'Absent', timeIn: null, timeOut: null }
      });
    }
  } catch (err) {
    handleError(res, err, 'getTodayStatus');
  }
};
