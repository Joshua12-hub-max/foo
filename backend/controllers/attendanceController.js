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

/**
 * Get dashboard statistics for today's attendance
 * Returns counts and employee lists for Present, Absent, Late, On-Leave
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Use local date instead of UTC to match database dates
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Get all active employees (excluding admins)
    const [allEmployees] = await db.query(`
      SELECT employee_id, first_name, last_name, department 
      FROM authentication 
      WHERE role != 'admin'
    `);
    
    // Get today's DTR records
    const [dtrRecords] = await db.query(`
      SELECT dtr.*, a.first_name, a.last_name, a.department
      FROM daily_time_records dtr
      JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE DATE(dtr.date) = DATE(?)
    `, [todayStr]);
    
    // Get approved leaves for today - use DATE() for proper comparison
    const [leaves] = await db.query(`
      SELECT lr.*, a.first_name, a.last_name, a.department
      FROM leave_requests lr
      JOIN authentication a ON lr.employee_id = a.employee_id
      WHERE lr.status = 'Approved' 
      AND DATE(?) >= DATE(lr.start_date) 
      AND DATE(?) <= DATE(lr.end_date)
    `, [todayStr, todayStr]);
    
    // Create lookup maps for quick access
    const dtrMap = new Map(dtrRecords.map(r => [r.employee_id, r]));
    const onLeaveEmployeeIds = new Set(leaves.map(l => l.employee_id));
    
    // Format time helper
    const formatTime = (dateTime) => {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };
    
    // Categorize employees
    const presentList = [];
    const lateList = [];
    const absentList = [];
    
    allEmployees.forEach(emp => {
      const employeeId = emp.employee_id;
      const name = `${emp.first_name} ${emp.last_name}`;
      
      // Skip if on leave
      if (onLeaveEmployeeIds.has(employeeId)) {
        return;
      }
      
      const dtr = dtrMap.get(employeeId);
      
      if (dtr) {
        const record = {
          id: employeeId,
          name: name,
          department: emp.department || '-',
          status: dtr.status,
          timeIn: formatTime(dtr.time_in),
          timeOut: formatTime(dtr.time_out),
          date: todayStr,
          minutesLate: dtr.late_minutes || 0
        };
        
        if (dtr.status === 'Late') {
          lateList.push(record);
          presentList.push(record); // Late employees are also present
        } else if (dtr.status === 'Present') {
          presentList.push(record);
        }
      } else {
        // No DTR record = Absent
        absentList.push({
          id: employeeId,
          name: name,
          department: emp.department || '-',
          status: 'Absent',
          reason: 'No clock-in recorded',
          date: todayStr
        });
      }
    });
    
    // Calculate counts
    const counts = {
      present: presentList.length,
      late: lateList.length,
      absent: absentList.length,
      onLeave: leaves.length,
      hired: allEmployees.length
    };
    
    return res.status(200).json({
      success: true,
      data: {
        counts,
        lists: {
          present: presentList,
          absent: absentList,
          late: lateList,
          onLeave: leaves.map(l => ({
            id: l.employee_id,
            name: `${l.first_name} ${l.last_name}`,
            department: l.department || '-',
            leaveType: l.leave_type,
            startDate: l.start_date,
            endDate: l.end_date
          }))
        }
      }
    });
  } catch (err) {
    handleError(res, err, 'getDashboardStats');
  }
};

/**
 * Get Tardiness Report
 * Returns aggregated late minutes and count per employee for a date range
 */
export const getTardinessReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Default to current month if not specified
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    
    let query = `
      SELECT 
        dtr.employee_id,
        a.first_name,
        a.last_name,
        a.department,
        SUM(dtr.late_minutes) as total_late_minutes,
        COUNT(CASE WHEN dtr.late_minutes > 0 THEN 1 END) as total_late_occurrences,
        COUNT(dtr.id) as days_present
      FROM daily_time_records dtr
      JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE dtr.date BETWEEN ? AND ?
    `;
    
    const params = [start, end];
    
    if (department && department !== 'All Departments') {
      query += ` AND a.department = ?`;
      params.push(department);
    }
    
    query += ` GROUP BY dtr.employee_id, a.first_name, a.last_name, a.department
               HAVING total_late_minutes > 0
               ORDER BY total_late_minutes DESC`;
               
    const [report] = await db.query(query, params);
    
    return res.status(200).json({
      success: true,
      range: { start, end },
      data: report
    });
    
  } catch (err) {
    handleError(res, err, 'getTardinessReport');
  }
};
