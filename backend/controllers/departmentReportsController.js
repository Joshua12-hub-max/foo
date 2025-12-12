import db from '../db/connection.js';

// Helper function for consistent error response
const handleError = (res, error, context) => {
  console.error(`Error in ${context}:`, error);
  return res.status(500).json({
    success: false,
    message: `An error occurred while ${context}`,
    error: error.message
  });
};

/**
 * Get department attendance summary
 * Aggregated attendance stats per department
 */
export const getDepartmentAttendanceSummary = async (req, res) => {
  try {
    const { fromDate, toDate, department } = req.query;

    // Default to current month if no date range provided
    const today = new Date();
    const defaultFromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultToDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const startDate = fromDate || defaultFromDate;
    const endDate = toDate || defaultToDate;

    let query = `
      SELECT 
        a.department,
        COUNT(DISTINCT a.employee_id) as total_employees,
        COUNT(DISTINCT CASE WHEN dtr.status = 'Present' THEN CONCAT(dtr.employee_id, '-', dtr.date) END) as present_days,
        COUNT(DISTINCT CASE WHEN dtr.status = 'Absent' THEN CONCAT(dtr.employee_id, '-', dtr.date) END) as absent_days,
        COUNT(DISTINCT CASE WHEN dtr.status = 'Late' THEN CONCAT(dtr.employee_id, '-', dtr.date) END) as late_days,
        COUNT(DISTINCT CASE WHEN dtr.status = 'Leave' THEN CONCAT(dtr.employee_id, '-', dtr.date) END) as leave_days,
        COALESCE(SUM(dtr.late_minutes), 0) as total_late_minutes,
        COALESCE(SUM(dtr.undertime_minutes), 0) as total_undertime_minutes,
        COALESCE(SUM(dtr.overtime_minutes), 0) as total_overtime_minutes,
        COUNT(dtr.id) as total_records
      FROM authentication a
      LEFT JOIN daily_time_records dtr ON a.employee_id = dtr.employee_id 
        AND dtr.date BETWEEN ? AND ?
      WHERE a.role != 'admin' AND a.department IS NOT NULL AND a.department != ''
    `;

    const params = [startDate, endDate];

    if (department && department !== 'all') {
      query += ' AND a.department = ?';
      params.push(department);
    }

    query += ' GROUP BY a.department ORDER BY a.department';

    const [rows] = await db.query(query, params);

    // Calculate working days in the date range (excluding weekends)
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
    }

    // Format response data
    const summaryData = rows.map(row => ({
      department: row.department || 'Unassigned',
      totalEmployees: row.total_employees,
      presentDays: row.present_days,
      absentDays: row.absent_days,
      lateDays: row.late_days,
      leaveDays: row.leave_days,
      totalLateMinutes: row.total_late_minutes,
      totalUndertimeMinutes: row.total_undertime_minutes,
      totalOvertimeMinutes: row.total_overtime_minutes,
      totalRecords: row.total_records,
      expectedRecords: row.total_employees * workingDays,
      attendanceRate: row.total_employees > 0 && workingDays > 0 
        ? ((row.present_days / (row.total_employees * workingDays)) * 100).toFixed(1)
        : '0.0'
    }));

    return res.status(200).json({
      success: true,
      data: summaryData,
      meta: {
        fromDate: startDate,
        toDate: endDate,
        workingDays,
        totalDepartments: summaryData.length
      }
    });
  } catch (error) {
    return handleError(res, error, 'fetching department attendance summary');
  }
};

/**
 * Get detailed attendance records for a specific department
 */
export const getDepartmentAttendanceDetails = async (req, res) => {
  try {
    const { department } = req.params;
    const { fromDate, toDate, status, search, page = 1, limit = 20 } = req.query;

    // Default to current month if no date range provided
    const today = new Date();
    const defaultFromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultToDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const startDate = fromDate || defaultFromDate;
    const endDate = toDate || defaultToDate;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        dtr.id,
        dtr.employee_id,
        CONCAT(a.first_name, ' ', a.last_name) as employee_name,
        a.department,
        a.job_title,
        dtr.date,
        dtr.time_in,
        dtr.time_out,
        dtr.status,
        dtr.late_minutes,
        dtr.undertime_minutes,
        dtr.overtime_minutes
      FROM daily_time_records dtr
      INNER JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE a.department = ? 
        AND dtr.date BETWEEN ? AND ?
    `;

    const params = [department, startDate, endDate];

    if (status && status !== 'all') {
      query += ' AND dtr.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (a.first_name LIKE ? OR a.last_name LIKE ? OR a.employee_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Count total for pagination
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countResult] = await db.query(countQuery, params);
    const totalRecords = countResult[0].total;

    // Add ordering and pagination
    query += ' ORDER BY dtr.date DESC, a.last_name, a.first_name';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    // Format response data
    const detailsData = rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      department: row.department,
      jobTitle: row.job_title || '-',
      date: row.date,
      timeIn: row.time_in ? new Date(row.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      timeOut: row.time_out ? new Date(row.time_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      status: row.status,
      lateMinutes: row.late_minutes || 0,
      undertimeMinutes: row.undertime_minutes || 0,
      overtimeMinutes: row.overtime_minutes || 0
    }));

    return res.status(200).json({
      success: true,
      data: detailsData,
      meta: {
        department,
        fromDate: startDate,
        toDate: endDate,
        totalRecords,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    return handleError(res, error, 'fetching department attendance details');
  }
};

/**
 * Export department attendance report data
 * Returns formatted data ready for CSV/PDF export
 */
export const exportDepartmentReport = async (req, res) => {
  try {
    const { fromDate, toDate, department, format } = req.query;

    // Default to current month if no date range provided
    const today = new Date();
    const defaultFromDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultToDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const startDate = fromDate || defaultFromDate;
    const endDate = toDate || defaultToDate;

    let query = `
      SELECT 
        a.department,
        dtr.employee_id,
        CONCAT(a.first_name, ' ', a.last_name) as employee_name,
        a.job_title,
        dtr.date,
        dtr.time_in,
        dtr.time_out,
        dtr.status,
        dtr.late_minutes,
        dtr.undertime_minutes,
        dtr.overtime_minutes
      FROM daily_time_records dtr
      INNER JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE dtr.date BETWEEN ? AND ?
        AND a.role != 'admin'
        AND a.department IS NOT NULL AND a.department != ''
    `;

    const params = [startDate, endDate];

    if (department && department !== 'all') {
      query += ' AND a.department = ?';
      params.push(department);
    }

    query += ' ORDER BY a.department, a.last_name, a.first_name, dtr.date';

    const [rows] = await db.query(query, params);

    // Group by department for better export structure
    const groupedData = {};
    let grandTotals = {
      totalEmployees: new Set(),
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalLeave: 0,
      totalLateMinutes: 0,
      totalUndertimeMinutes: 0,
      totalOvertimeMinutes: 0
    };

    rows.forEach(row => {
      const dept = row.department || 'Unassigned';
      
      if (!groupedData[dept]) {
        groupedData[dept] = {
          department: dept,
          employees: new Set(),
          records: [],
          totals: {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            lateMinutes: 0,
            undertimeMinutes: 0,
            overtimeMinutes: 0
          }
        };
      }

      groupedData[dept].employees.add(row.employee_id);
      grandTotals.totalEmployees.add(row.employee_id);

      // Update status counts
      if (row.status === 'Present') {
        groupedData[dept].totals.present++;
        grandTotals.totalPresent++;
      } else if (row.status === 'Absent') {
        groupedData[dept].totals.absent++;
        grandTotals.totalAbsent++;
      } else if (row.status === 'Late') {
        groupedData[dept].totals.late++;
        grandTotals.totalLate++;
      } else if (row.status === 'Leave') {
        groupedData[dept].totals.leave++;
        grandTotals.totalLeave++;
      }

      groupedData[dept].totals.lateMinutes += row.late_minutes || 0;
      groupedData[dept].totals.undertimeMinutes += row.undertime_minutes || 0;
      groupedData[dept].totals.overtimeMinutes += row.overtime_minutes || 0;

      grandTotals.totalLateMinutes += row.late_minutes || 0;
      grandTotals.totalUndertimeMinutes += row.undertime_minutes || 0;
      grandTotals.totalOvertimeMinutes += row.overtime_minutes || 0;

      groupedData[dept].records.push({
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        jobTitle: row.job_title || '-',
        date: row.date,
        timeIn: row.time_in ? new Date(row.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
        timeOut: row.time_out ? new Date(row.time_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
        status: row.status,
        lateMinutes: row.late_minutes || 0,
        undertimeMinutes: row.undertime_minutes || 0,
        overtimeMinutes: row.overtime_minutes || 0
      });
    });

    // Convert to array and add employee count
    const exportData = Object.values(groupedData).map(dept => ({
      ...dept,
      employeeCount: dept.employees.size,
      employees: undefined // Remove Set from response
    }));

    return res.status(200).json({
      success: true,
      data: exportData,
      grandTotals: {
        totalEmployees: grandTotals.totalEmployees.size,
        totalPresent: grandTotals.totalPresent,
        totalAbsent: grandTotals.totalAbsent,
        totalLate: grandTotals.totalLate,
        totalLeave: grandTotals.totalLeave,
        totalLateMinutes: grandTotals.totalLateMinutes,
        totalUndertimeMinutes: grandTotals.totalUndertimeMinutes,
        totalOvertimeMinutes: grandTotals.totalOvertimeMinutes
      },
      meta: {
        fromDate: startDate,
        toDate: endDate,
        totalDepartments: exportData.length,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.employee_id || 'admin'
      }
    });
  } catch (error) {
    return handleError(res, error, 'exporting department report');
  }
};

/**
 * Get list of all departments for filter dropdown
 */
export const getDepartmentList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT department 
      FROM authentication 
      WHERE department IS NOT NULL 
        AND department != '' 
        AND role != 'admin'
      ORDER BY department
    `);

    const departments = rows.map(row => row.department);

    return res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    return handleError(res, error, 'fetching department list');
  }
};

/**
 * Get report history (saved reports)
 */
export const getDepartmentReportHistory = async (req, res) => {
  try {
    // Check if table exists first
    const [tables] = await db.query("SHOW TABLES LIKE 'department_reports'");
    
    if (tables.length === 0) {
      // Table doesn't exist, return empty array
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Report history feature not yet enabled'
      });
    }

    const [rows] = await db.query(`
      SELECT 
        dr.*,
        CONCAT(a.first_name, ' ', a.last_name) as generated_by_name
      FROM department_reports dr
      LEFT JOIN authentication a ON dr.generated_by = a.employee_id
      ORDER BY dr.created_at DESC
      LIMIT 50
    `);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    return handleError(res, error, 'fetching report history');
  }
};

/**
 * Save a generated report (for history tracking)
 */
export const saveDepartmentReport = async (req, res) => {
  try {
    const { reportName, department, fromDate, toDate, totalEmployees, totalPresent, totalAbsent, totalLate } = req.body;
    const generatedBy = req.user?.employee_id || 'admin';

    // Check if table exists, create if not
    await db.query(`
      CREATE TABLE IF NOT EXISTS department_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        total_employees INT,
        total_present INT,
        total_absent INT,
        total_late INT,
        generated_by VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [result] = await db.query(`
      INSERT INTO department_reports 
      (report_name, department, from_date, to_date, total_employees, total_present, total_absent, total_late, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [reportName, department, fromDate, toDate, totalEmployees, totalPresent, totalAbsent, totalLate, generatedBy]);

    return res.status(201).json({
      success: true,
      message: 'Report saved successfully',
      data: {
        id: result.insertId,
        reportName,
        department,
        fromDate,
        toDate
      }
    });
  } catch (error) {
    return handleError(res, error, 'saving report');
  }
};

/**
 * Delete a saved report
 */
export const deleteDepartmentReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM department_reports WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    return handleError(res, error, 'deleting report');
  }
};
