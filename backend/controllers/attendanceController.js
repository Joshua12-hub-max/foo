import db from '../db/connection.js';
import { processDailyAttendance } from '../services/attendanceProcessor.js';

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
    const scanTime = time ? new Date(time) : new Date();
    const dateStr = scanTime.toISOString().split('T')[0];

    // 1. Log the raw event
    await db.query(
      "INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, 'IN', 'WEB')",
      [employeeId, scanTime]
    );

    // 2. Process DTR (Calculate Late, etc.)
    await processDailyAttendance(employeeId, dateStr);

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
    const scanTime = time ? new Date(time) : new Date();
    const dateStr = scanTime.toISOString().split('T')[0];
    
    // 1. Log the raw event
    await db.query(
      "INSERT INTO attendance_logs (employee_id, scan_time, type, source) VALUES (?, ?, 'OUT', 'WEB')",
      [employeeId, scanTime]
    );

    // 2. Process DTR (Calculate Undertime, etc.)
    await processDailyAttendance(employeeId, dateStr);

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
  const employeeId = req.query.employeeId || req.query.id;

  try {
    let query;
    let params = [];

    if (employeeId) {
      query = `
        SELECT dtr.*, a.first_name, a.last_name, a.department 
        FROM daily_time_records dtr
        JOIN authentication a ON dtr.employee_id = a.employee_id
        WHERE dtr.employee_id = ? 
        ORDER BY dtr.date DESC LIMIT 50
      `;
      params = [employeeId];
    } else {
      // Admin view: fetch all logs
      query = `
        SELECT dtr.*, a.first_name, a.last_name, a.department 
        FROM daily_time_records dtr
        JOIN authentication a ON dtr.employee_id = a.employee_id
        ORDER BY dtr.date DESC LIMIT 200
      `;
    }

    const [logs] = await db.query(query, params);
    
    // Transform data if necessary or return as is
    const formattedLogs = logs.map(log => ({
      ...log,
      employee_name: `${log.first_name} ${log.last_name}`
    }));

    return res.status(200).json({
      success: true,
      message: formattedLogs.length > 0 ? "Logs retrieved successfully." : "No logs found.",
      data: formattedLogs
    });

  } catch (err) {
    handleError(res, err, 'getLogs');
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    // Getting raw logs for recent activity feed might be better, but DTR is okay too. 
    // Let's stick to DTR as per original code to show "Summarized" activity.
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

export const getRawLogs = async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT al.*, a.first_name, a.last_name, a.department
      FROM attendance_logs al
      LEFT JOIN authentication a ON al.employee_id = a.employee_id
      ORDER BY al.scan_time DESC
      LIMIT 500
    `);

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    handleError(res, err, 'getRawLogs');
  }
};
