import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Log monitoring activity
const logMonitoringActivity = async (logType, referenceId, action, performedBy, oldStatus, newStatus, details = null) => {
  try {
    await db.query(
      `INSERT INTO spms_monitoring_logs (log_type, reference_id, action, performed_by, old_status, new_status, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [logType, referenceId, action, performedBy, oldStatus, newStatus, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Error logging monitoring activity:', error);
  }
};

// =====================================================
// COACHING LOGS CRUD
// =====================================================

// Get all coaching logs with filters
export const getCoachingLogs = async (req, res) => {
  try {
    const { employee_id, supervisor_id, status, start_date, end_date, department } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        c.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        e.employee_id as employee_code,
        s.first_name as supervisor_first_name,
        s.last_name as supervisor_last_name,
        s.job_title as supervisor_job_title,
        i.id as ipcr_id,
        cyc.title as cycle_title
      FROM spms_coaching_logs c
      JOIN authentication e ON c.employee_id = e.id
      JOIN authentication s ON c.supervisor_id = s.id
      LEFT JOIN spms_ipcr i ON c.ipcr_id = i.id
      LEFT JOIN spms_cycles cyc ON i.cycle_id = cyc.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (user.role !== 'admin' && user.role !== 'hr') {
      // Supervisors can see their assigned coaching sessions
      // Employees can see their own sessions
      query += ' AND (c.employee_id = ? OR c.supervisor_id = ?)';
      params.push(user.id, user.id);
    }

    if (employee_id) {
      query += ' AND c.employee_id = ?';
      params.push(employee_id);
    }

    if (supervisor_id) {
      query += ' AND c.supervisor_id = ?';
      params.push(supervisor_id);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND c.coaching_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND c.coaching_date <= ?';
      params.push(end_date);
    }

    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    query += ' ORDER BY c.coaching_date DESC, c.created_at DESC';

    const [logs] = await db.query(query, params);
    res.json({ success: true, coachingLogs: logs });
  } catch (error) {
    console.error('Get Coaching Logs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coaching logs' });
  }
};

// Get single coaching log
export const getCoachingLog = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [logs] = await db.query(`
      SELECT 
        c.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        s.first_name as supervisor_first_name,
        s.last_name as supervisor_last_name,
        s.job_title as supervisor_job_title
      FROM spms_coaching_logs c
      JOIN authentication e ON c.employee_id = e.id
      JOIN authentication s ON c.supervisor_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: 'Coaching log not found' });
    }

    const log = logs[0];

    // Security check
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (log.employee_id !== user.id && log.supervisor_id !== user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
    }

    res.json({ success: true, coachingLog: log });
  } catch (error) {
    console.error('Get Coaching Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coaching log' });
  }
};

// Create coaching log
export const createCoachingLog = async (req, res) => {
  try {
    const {
      ipcr_id,
      employee_id,
      supervisor_id,
      coaching_date,
      coaching_type,
      discussion_topics,
      agreed_actions,
      employee_feedback,
      supervisor_notes,
      follow_up_date,
      status
    } = req.body;
    const user = req.user;

    // Validate required fields
    if (!employee_id || !coaching_date) {
      return res.status(400).json({ success: false, message: 'Employee and coaching date are required' });
    }

    // Use current user as supervisor if not specified
    const actualSupervisorId = supervisor_id || user.id;

    const [result] = await db.query(
      `INSERT INTO spms_coaching_logs 
       (ipcr_id, employee_id, supervisor_id, coaching_date, coaching_type, 
        discussion_topics, agreed_actions, employee_feedback, supervisor_notes, 
        follow_up_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ipcr_id || null,
        employee_id,
        actualSupervisorId,
        coaching_date,
        coaching_type || 'Monthly Check-in',
        discussion_topics || null,
        agreed_actions || null,
        employee_feedback || null,
        supervisor_notes || null,
        follow_up_date || null,
        status || 'Scheduled'
      ]
    );

    // Log activity
    await logMonitoringActivity('coaching', result.insertId, 'Created', user.id, null, status || 'Scheduled');

    // Send notification to employee
    try {
      const coachingDate = new Date(coaching_date).toLocaleDateString();
      await createNotification({
        recipientId: employee_id,
        senderId: user.id,
        title: 'Coaching Session Scheduled',
        message: `A ${coaching_type || 'coaching'} session has been scheduled for ${coachingDate}.`,
        type: 'coaching_scheduled',
        referenceId: result.insertId
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Coaching session created successfully',
      coachingLogId: result.insertId
    });
  } catch (error) {
    console.error('Create Coaching Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create coaching log' });
  }
};

// Update coaching log
export const updateCoachingLog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      coaching_date,
      coaching_type,
      discussion_topics,
      agreed_actions,
      employee_feedback,
      supervisor_notes,
      follow_up_date,
      follow_up_completed,
      status
    } = req.body;
    const user = req.user;

    // Get current log for status tracking
    const [existing] = await db.query('SELECT * FROM spms_coaching_logs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Coaching log not found' });
    }

    const oldStatus = existing[0].status;

    await db.query(
      `UPDATE spms_coaching_logs SET
        coaching_date = COALESCE(?, coaching_date),
        coaching_type = COALESCE(?, coaching_type),
        discussion_topics = COALESCE(?, discussion_topics),
        agreed_actions = COALESCE(?, agreed_actions),
        employee_feedback = COALESCE(?, employee_feedback),
        supervisor_notes = COALESCE(?, supervisor_notes),
        follow_up_date = COALESCE(?, follow_up_date),
        follow_up_completed = COALESCE(?, follow_up_completed),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        coaching_date,
        coaching_type,
        discussion_topics,
        agreed_actions,
        employee_feedback,
        supervisor_notes,
        follow_up_date,
        follow_up_completed,
        status,
        id
      ]
    );

    // Log status change
    if (status && status !== oldStatus) {
      await logMonitoringActivity('coaching', id, 'Status Changed', user.id, oldStatus, status);
    }

    res.json({ success: true, message: 'Coaching log updated successfully' });
  } catch (error) {
    console.error('Update Coaching Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update coaching log' });
  }
};

// Delete coaching log
export const deleteCoachingLog = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only allow deletion of Scheduled sessions
    const [logs] = await db.query('SELECT * FROM spms_coaching_logs WHERE id = ?', [id]);
    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: 'Coaching log not found' });
    }

    if (logs[0].status !== 'Scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled sessions can be deleted' });
    }

    await db.query('DELETE FROM spms_coaching_logs WHERE id = ?', [id]);
    
    await logMonitoringActivity('coaching', id, 'Deleted', user.id, logs[0].status, null);

    res.json({ success: true, message: 'Coaching log deleted successfully' });
  } catch (error) {
    console.error('Delete Coaching Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coaching log' });
  }
};

// Get employee's own coaching sessions
export const getMyCoachingSessions = async (req, res) => {
  try {
    const user = req.user;

    const [logs] = await db.query(`
      SELECT 
        c.*,
        s.first_name as supervisor_first_name,
        s.last_name as supervisor_last_name,
        s.job_title as supervisor_job_title
      FROM spms_coaching_logs c
      JOIN authentication s ON c.supervisor_id = s.id
      WHERE c.employee_id = ?
      ORDER BY c.coaching_date DESC
    `, [user.id]);

    res.json({ success: true, coachingSessions: logs });
  } catch (error) {
    console.error('Get My Coaching Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coaching sessions' });
  }
};

// Complete a coaching session
export const completeCoachingSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { discussion_topics, agreed_actions, employee_feedback, supervisor_notes } = req.body;
    const user = req.user;

    const [logs] = await db.query('SELECT * FROM spms_coaching_logs WHERE id = ?', [id]);
    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: 'Coaching log not found' });
    }

    if (logs[0].supervisor_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned supervisor can complete this session' });
    }

    await db.query(
      `UPDATE spms_coaching_logs SET
        status = 'Completed',
        discussion_topics = COALESCE(?, discussion_topics),
        agreed_actions = COALESCE(?, agreed_actions),
        employee_feedback = COALESCE(?, employee_feedback),
        supervisor_notes = COALESCE(?, supervisor_notes)
       WHERE id = ?`,
      [discussion_topics, agreed_actions, employee_feedback, supervisor_notes, id]
    );

    await logMonitoringActivity('coaching', id, 'Completed', user.id, logs[0].status, 'Completed');

    // Send notification to employee about completed session
    try {
      await createNotification({
        recipientId: logs[0].employee_id,
        senderId: user.id,
        title: 'Coaching Session Completed',
        message: 'Your coaching session has been completed. Please review the notes and agreed actions.',
        type: 'coaching_completed',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'Coaching session completed successfully' });
  } catch (error) {
    console.error('Complete Coaching Session Error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete coaching session' });
  }
};

// Get coaching statistics
export const getCoachingStats = async (req, res) => {
  try {
    const { department, start_date, end_date } = req.query;

    let where = '1=1';
    const params = [];

    if (department) {
      where += ' AND e.department = ?';
      params.push(department);
    }

    if (start_date) {
      where += ' AND c.coaching_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      where += ' AND c.coaching_date <= ?';
      params.push(end_date);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN c.status = 'Completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN c.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled_sessions,
        SUM(CASE WHEN c.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_sessions,
        COUNT(DISTINCT c.employee_id) as employees_coached
      FROM spms_coaching_logs c
      JOIN authentication e ON c.employee_id = e.id
      WHERE ${where}
    `, params);

    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Get Coaching Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coaching statistics' });
  }
};
