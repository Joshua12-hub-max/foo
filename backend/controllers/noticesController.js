import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// HELPER FUNCTIONS
const getAdjectivalRating = (rating) => {
  if (rating >= 4.50) return 'Outstanding';
  if (rating >= 3.50) return 'Very Satisfactory';
  if (rating >= 2.50) return 'Satisfactory';
  if (rating >= 1.50) return 'Unsatisfactory';
  return 'Poor';
};

const generateNoticeNumber = async () => {
  const year = new Date().getFullYear();
  const [count] = await db.query(
    'SELECT COUNT(*) as count FROM spms_performance_notices WHERE YEAR(created_at) = ?',
    [year]
  );
  return `PN-${year}-${String(count[0].count + 1).padStart(4, '0')}`;
};


// AUTO-TRIGGER FUNCTIONS

export const checkAndCreateNotice = async (ipcrId) => {
  try {
    // Get IPCR details
    const [ipcrs] = await db.query(`
      SELECT 
        i.*,
        e.id as emp_id, e.first_name, e.last_name, e.department,
        c.title as cycle_title, c.period
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE i.id = ?
    `, [ipcrId]);

    if (ipcrs.length === 0) return null;
    
    const ipcr = ipcrs[0];
    const rating = parseFloat(ipcr.final_rating);
    
    // Only process if Unsatisfactory or Poor
    if (rating >= 2.50) return null;

    // Check rating history for consecutive issues
    const [history] = await db.query(`
      SELECT 
        SUM(CASE WHEN is_unsatisfactory = TRUE THEN 1 ELSE 0 END) as unsatisfactory_count,
        SUM(CASE WHEN is_poor = TRUE THEN 1 ELSE 0 END) as poor_count
      FROM spms_rating_history
      WHERE employee_id = ?
      ORDER BY created_at DESC
      LIMIT 3
    `, [ipcr.employee_id]);

    const unsatCount = (history[0]?.unsatisfactory_count || 0) + (rating < 2.50 && rating >= 1.50 ? 1 : 0);
    const poorCount = (history[0]?.poor_count || 0) + (rating < 1.50 ? 1 : 0);

    // Determine notice type
    let noticeType;
    if (poorCount >= 1) {
      noticeType = 'Separation Recommendation';
    } else if (unsatCount >= 2) {
      noticeType = 'Show Cause';
    } else if (unsatCount >= 1) {
      noticeType = 'Development Required';
    } else if (rating < 2.50) {
      noticeType = 'Warning';
    }

    if (!noticeType) return null;

    // Create the notice
    const noticeNumber = await generateNoticeNumber();
    
    const [result] = await db.query(
      `INSERT INTO spms_performance_notices 
       (employee_id, ipcr_id, notice_type, notice_number, rating_period, 
        rating_value, adjectival_rating, notice_date, deadline_date, issued_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, 'Draft')`,
      [ipcr.employee_id, ipcrId, noticeType, noticeNumber, 
       `${ipcr.cycle_title} - ${ipcr.period}`, rating, getAdjectivalRating(rating),
       ipcr.rater_id]
    );

    // Record in rating history
    await db.query(
      `INSERT INTO spms_rating_history 
       (employee_id, cycle_id, ipcr_id, final_rating, adjectival_rating, is_unsatisfactory, is_poor, consecutive_unsatisfactory, consecutive_poor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         final_rating = VALUES(final_rating),
         adjectival_rating = VALUES(adjectival_rating),
         is_unsatisfactory = VALUES(is_unsatisfactory),
         is_poor = VALUES(is_poor),
         consecutive_unsatisfactory = VALUES(consecutive_unsatisfactory),
         consecutive_poor = VALUES(consecutive_poor)`,
      [ipcr.employee_id, ipcr.cycle_id, ipcrId, rating, getAdjectivalRating(rating),
       rating < 2.50 && rating >= 1.50, rating < 1.50, unsatCount, poorCount]
    );

    return { noticeId: result.insertId, noticeType, noticeNumber };
  } catch (error) {
    return null;
  }
};

/**
 * Auto-create development plan for employees with poor performance
 */
export const autoCreateDevelopmentPlan = async (ipcrId, noticeId) => {
  try {
    const [ipcrs] = await db.query(`
      SELECT i.*, e.first_name, e.last_name, c.title as cycle_title
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE i.id = ?
    `, [ipcrId]);

    if (ipcrs.length === 0) return null;
    
    const ipcr = ipcrs[0];

    // Check if development plan already exists
    const [existing] = await db.query(
      'SELECT id FROM development_plans WHERE ipcr_id = ?',
      [ipcrId]
    );

    if (existing.length > 0) return existing[0].id;

    // Create development plan
    const [result] = await db.query(
      `INSERT INTO development_plans 
       (employee_id, title, description, status, ipcr_id, auto_generated, trigger_reason, created_at)
       VALUES (?, ?, ?, 'Pending', ?, TRUE, ?, NOW())`,
      [
        ipcr.employee_id,
        `Performance Improvement Plan - ${ipcr.cycle_title}`,
        `Auto-generated development plan due to ${getAdjectivalRating(ipcr.final_rating)} performance rating (${ipcr.final_rating}).`,
        ipcrId,
        `IPCR Rating: ${ipcr.final_rating} (${getAdjectivalRating(ipcr.final_rating)})`
      ]
    );

    // Notify employee
    try {
      await createNotification({
        recipientId: ipcr.employee_id,
        senderId: ipcr.rater_id,
        title: 'Development Plan Created',
        message: `A development plan has been created to help improve your performance. Please review it with your supervisor.`,
        type: 'development_plan',
        referenceId: result.insertId
      });
    } catch (err) {
      // Silent fail
    }

    return result.insertId;
  } catch (error) {
    return null;
  }
};

// NOTICES CRUD

export const getPerformanceNotices = async (req, res) => {
  try {
    const { employee_id, notice_type, status, department } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        n.*,
        e.first_name, e.last_name, e.department, e.employee_id as employee_code,
        ib.first_name as issued_by_first, ib.last_name as issued_by_last
      FROM spms_performance_notices n
      JOIN authentication e ON n.employee_id = e.id
      JOIN authentication ib ON n.issued_by = ib.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filter
    if (user.role !== 'admin' && user.role !== 'hr') {
      query += ' AND n.employee_id = ?';
      params.push(user.id);
    }

    if (employee_id) {
      query += ' AND n.employee_id = ?';
      params.push(employee_id);
    }
    if (notice_type) {
      query += ' AND n.notice_type = ?';
      params.push(notice_type);
    }
    if (status) {
      query += ' AND n.status = ?';
      params.push(status);
    }
    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    query += ' ORDER BY n.created_at DESC';

    const [notices] = await db.query(query, params);
    res.json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notices' });
  }
};

export const getPerformanceNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const [notices] = await db.query(`
      SELECT 
        n.*,
        e.first_name, e.last_name, e.email, e.department, e.job_title, e.employee_id as employee_code,
        ib.first_name as issued_by_first, ib.last_name as issued_by_last,
        ab.first_name as ack_by_first, ab.last_name as ack_by_last,
        i.final_rating as ipcr_rating, c.title as cycle_title, c.period
      FROM spms_performance_notices n
      JOIN authentication e ON n.employee_id = e.id
      JOIN authentication ib ON n.issued_by = ib.id
      LEFT JOIN authentication ab ON n.acknowledged_by = ab.id
      JOIN spms_ipcr i ON n.ipcr_id = i.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE n.id = ?
    `, [id]);

    if (notices.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({ success: true, notice: notices[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notice' });
  }
};

export const createPerformanceNotice = async (req, res) => {
  try {
    const { 
      employee_id, ipcr_id, notice_type, rating_period, 
      rating_value, deadline_date, hr_remarks 
    } = req.body;
    const user = req.user;

    const noticeNumber = await generateNoticeNumber();

    const [result] = await db.query(
      `INSERT INTO spms_performance_notices 
       (employee_id, ipcr_id, notice_type, notice_number, rating_period, 
        rating_value, adjectival_rating, notice_date, deadline_date, issued_by, hr_remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
      [employee_id, ipcr_id, notice_type, noticeNumber, rating_period,
       rating_value, getAdjectivalRating(rating_value), deadline_date, user.id, hr_remarks]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Notice created',
      noticeId: result.insertId,
      noticeNumber
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notice' });
  }
};

export const issueNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [notices] = await db.query('SELECT * FROM spms_performance_notices WHERE id = ?', [id]);
    if (notices.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (notices[0].status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Notice already issued' });
    }

    await db.query(
      "UPDATE spms_performance_notices SET status = 'Issued', effective_date = CURDATE() WHERE id = ?",
      [id]
    );

    // Notify employee
    try {
      await createNotification({
        recipientId: notices[0].employee_id,
        senderId: user.id,
        title: `Performance Notice: ${notices[0].notice_type}`,
        message: `A ${notices[0].notice_type} notice has been issued regarding your performance. Please review and acknowledge.`,
        type: 'performance_notice',
        referenceId: id
      });
    } catch (err) {
      // Silent fail
    }

    res.json({ success: true, message: 'Notice issued' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to issue notice' });
  }
};

export const acknowledgeNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const user = req.user;

    const [notices] = await db.query('SELECT * FROM spms_performance_notices WHERE id = ?', [id]);
    if (notices.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Verify employee
    if (notices[0].employee_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query(
      `UPDATE spms_performance_notices SET 
        status = 'Acknowledged',
        acknowledged_by = ?,
        acknowledged_date = CURDATE(),
        employee_response = ?
       WHERE id = ?`,
      [user.id, response, id]
    );

    res.json({ success: true, message: 'Notice acknowledged' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to acknowledge notice' });
  }
};

export const updateNoticeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hr_remarks } = req.body;

    await db.query(
      `UPDATE spms_performance_notices SET 
        status = ?,
        hr_remarks = COALESCE(?, hr_remarks)
       WHERE id = ?`,
      [status, hr_remarks, id]
    );

    res.json({ success: true, message: 'Notice status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notice' });
  }
};

// =====================================================
// REPORTING
// =====================================================

export const getNoticesSummary = async (req, res) => {
  try {
    const [summary] = await db.query(`
      SELECT 
        notice_type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'Issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'Acknowledged' THEN 1 ELSE 0 END) as acknowledged,
        SUM(CASE WHEN status = 'Complied' THEN 1 ELSE 0 END) as complied,
        SUM(CASE WHEN status = 'Escalated' THEN 1 ELSE 0 END) as escalated
      FROM spms_performance_notices
      GROUP BY notice_type
    `);

    const [employeesAtRisk] = await db.query(`
      SELECT 
        e.id, e.first_name, e.last_name, e.department,
        rh.consecutive_unsatisfactory, rh.consecutive_poor
      FROM spms_rating_history rh
      JOIN authentication e ON rh.employee_id = e.id
      WHERE rh.consecutive_unsatisfactory >= 1 OR rh.consecutive_poor >= 1
      ORDER BY rh.consecutive_poor DESC, rh.consecutive_unsatisfactory DESC
    `);

    res.json({ 
      success: true, 
      summary,
      employeesAtRisk
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};
