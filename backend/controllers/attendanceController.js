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

// Helper to get local date string (YYYY-MM-DD) for shifts calculation
const getLocalDate = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

export const clockIn = async (req, res) => {
  // Security: Use authenticated user's ID, not the body's
  const employeeId = req.user.employeeId; 

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "User not authenticated or missing Employee ID.", data: null });
  }

  try {
    // Security: Use server time, ignore client time
    const scanTime = new Date();
    const dateStr = getLocalDate();

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
  // Security: Use authenticated user's ID
  const employeeId = req.user.employeeId;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "User not authenticated or missing Employee ID.", data: null });
  }

  try {
    // Security: Use server time
    const scanTime = new Date();
    const dateStr = getLocalDate();
    
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
  // Security: Determine access level
  const user = req.user;
  const isAdminOrHr = ['admin', 'hr'].includes(user.role?.toLowerCase());
  
  // If admin/hr, use query param, otherwise force own ID
  let targetEmployeeId = isAdminOrHr ? (req.query.employeeId || req.query.id) : user.employeeId;

  // Pagination & Filtering
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    let query;
    let countQuery;
    let params = [];
    let whereClauses = [];

    if (targetEmployeeId) {
      whereClauses.push("dtr.employee_id = ?");
      params.push(targetEmployeeId);
    }

    if (startDate && endDate) {
      whereClauses.push("dtr.date BETWEEN ? AND ?");
      params.push(startDate, endDate);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    query = `
      SELECT dtr.*, a.first_name, a.last_name, a.department 
      FROM daily_time_records dtr
      JOIN authentication a ON dtr.employee_id = a.employee_id
      ${whereString}
      ORDER BY dtr.date DESC 
      LIMIT ? OFFSET ?
    `;
    
    countQuery = `
      SELECT COUNT(*) as total 
      FROM daily_time_records dtr
      ${whereString}
    `;

    const [logs] = await db.query(query, [...params, limit, offset]);
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Transform data
    const formattedLogs = logs.map(log => ({
      ...log,
      employee_name: `${log.first_name} ${log.last_name}`
    }));

    return res.status(200).json({
      success: true,
      message: formattedLogs.length > 0 ? "Logs retrieved successfully." : "No logs found.",
      data: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
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
  let { employeeId } = req.query;
  const user = req.user;
  const isAdminOrHr = ['admin', 'hr'].includes(user.role?.toLowerCase());

  // Security: Non-admins can only see their own status
  if (!isAdminOrHr) {
    employeeId = user.employeeId;
  }

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required.", data: null });
  }
    
  try {
    const date = getLocalDate();

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
    const todayStr = getLocalDate();
    const now = new Date();
    
    // Get current day name (e.g., 'Monday')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];

    // Get all active employees (excluding admins) with their schedule for today
    const [allEmployees] = await db.query(`
      SELECT a.employee_id, a.first_name, a.last_name, a.department, a.job_title, a.date_hired, a.employment_status,
             s.is_rest_day, s.start_time, s.end_time
      FROM authentication a
      LEFT JOIN schedules s ON a.employee_id = s.employee_id AND s.day_of_week = ?
      WHERE a.role != 'admin'
      ORDER BY a.date_hired DESC
    `, [dayName]);
    
    // Get today's DTR records
    const [dtrRecords] = await db.query(`
      SELECT dtr.*, a.first_name, a.last_name, a.department
      FROM daily_time_records dtr
      JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE DATE(dtr.date) = ?
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

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // Categorize employees
    const presentList = [];
    const lateList = [];
    const absentList = [];
    const hiredList = []; // New Hired List
    
    allEmployees.forEach(emp => {
      const employeeId = emp.employee_id;
      const name = `${emp.first_name} ${emp.last_name}`;

      // Populate Hired List
      hiredList.push({
        id: employeeId,
        name: name,
        department: emp.department || '-',
        position: emp.job_title || '-',
        status: emp.employment_status || 'Active',
        hireDate: formatDate(emp.date_hired)
      });
      
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
        // No DTR record: Check if they were expected to work
        // If it's a rest day OR they have no schedule record at all for this day, we don't count them as 'Absent'
        // (Assuming no schedule = not scheduled to work)
        if (emp.is_rest_day === 0) { // 0 in MySQL is false, explicitly scheduled to work
          absentList.push({
            id: employeeId,
            name: name,
            department: emp.department || '-',
            status: 'Absent',
            reason: 'No clock-in recorded',
            date: todayStr
          });
        }
        // If is_rest_day is 1 or null (no schedule), they are not counted as Absent.
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
          hired: hiredList,
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
