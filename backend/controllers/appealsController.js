/**
 * Appeals Controller
 * Employee performance rating appeal system per CSC MC 6-2012
 */

import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// =====================================================
// APPEALS CRUD
// =====================================================

export const getAppeals = async (req, res) => {
  try {
    const { status, employee_id, cycle_id } = req.query;
    const user = req.user;
    
    let query = `
      SELECT 
        a.*,
        e.first_name as employee_first, e.last_name as employee_last,
        e.department, e.employee_id as employee_code,
        d.first_name as decided_by_first, d.last_name as decided_by_last,
        i.final_rating as current_ipcr_rating,
        c.title as cycle_title, c.year, c.period
      FROM spms_appeals a
      JOIN authentication e ON a.employee_id = e.id
      LEFT JOIN authentication d ON a.decided_by = d.id
      JOIN spms_ipcr i ON a.ipcr_id = i.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (user.role !== 'admin' && user.role !== 'hr') {
      query += ' AND a.employee_id = ?';
      params.push(user.id);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (employee_id) {
      query += ' AND a.employee_id = ?';
      params.push(employee_id);
    }
    if (cycle_id) {
      query += ' AND i.cycle_id = ?';
      params.push(cycle_id);
    }

    query += ' ORDER BY a.created_at DESC';

    const [appeals] = await db.query(query, params);
    res.json({ success: true, appeals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appeals' });
  }
};

export const getAppeal = async (req, res) => {
  try {
    const { id } = req.params;

    const [appeals] = await db.query(`
      SELECT 
        a.*,
        e.first_name as employee_first, e.last_name as employee_last,
        e.department, e.job_title, e.employee_id as employee_code,
        d.first_name as decided_by_first, d.last_name as decided_by_last,
        i.id as ipcr_id, i.final_rating, i.status as ipcr_status,
        c.title as cycle_title, c.year, c.period
      FROM spms_appeals a
      JOIN authentication e ON a.employee_id = e.id
      LEFT JOIN authentication d ON a.decided_by = d.id
      JOIN spms_ipcr i ON a.ipcr_id = i.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (appeals.length === 0) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    res.json({ success: true, appeal: appeals[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appeal' });
  }
};

export const fileAppeal = async (req, res) => {
  try {
    const { ipcr_id, grounds, supporting_documents } = req.body;
    const user = req.user;

    // Verify IPCR exists and belongs to user
    const [ipcrs] = await db.query(
      'SELECT * FROM spms_ipcr WHERE id = ?',
      [ipcr_id]
    );

    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    if (ipcr.employee_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only appeal your own IPCR' });
    }

    // Check if appeal already exists
    const [existing] = await db.query(
      'SELECT id FROM spms_appeals WHERE ipcr_id = ? AND status NOT IN ("Decided", "Withdrawn")',
      [ipcr_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An active appeal already exists for this IPCR' });
    }

    // CSC requires appeal within 10 days
    const [ratedDate] = await db.query(
      'SELECT date_rated FROM spms_ipcr WHERE id = ?',
      [ipcr_id]
    );
    
    // Insert appeal
    const [result] = await db.query(
      `INSERT INTO spms_appeals 
       (ipcr_id, employee_id, appeal_date, grounds, supporting_documents, original_rating, original_adjectival) 
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?)`,
      [ipcr_id, user.id, grounds, supporting_documents, ipcr.final_rating, 
       getAdjectivalRating(ipcr.final_rating)]
    );

    // Mark IPCR as having appeal
    await db.query('UPDATE spms_ipcr SET appeal_filed = TRUE, appeal_id = ? WHERE id = ?', 
      [result.insertId, ipcr_id]);

    // Notify HR/Admin about new appeal
    try {
      const [admins] = await db.query(
        "SELECT id FROM authentication WHERE role IN ('admin', 'hr') LIMIT 5"
      );
      for (const admin of admins) {
        await createNotification({
          recipientId: admin.id,
          senderId: user.id,
          title: 'New Performance Appeal Filed',
          message: `An employee has filed an appeal for their performance rating.`,
          type: 'appeal_filed',
          referenceId: result.insertId
        });
      }
    } catch (notifyErr) {
      // Silent fail
    }

    res.status(201).json({ 
      success: true, 
      message: 'Appeal filed successfully',
      appealId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to file appeal' });
  }
};

export const reviewAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { hearing_date, remarks } = req.body;
    const user = req.user;

    // Verify user has permission (PMT, HR, Admin)
    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const [appeals] = await db.query('SELECT * FROM spms_appeals WHERE id = ?', [id]);
    if (appeals.length === 0) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    if (appeals[0].status !== 'Filed') {
      return res.status(400).json({ success: false, message: 'Appeal is already under review' });
    }

    await db.query(
      `UPDATE spms_appeals SET 
        status = 'Under Review',
        hearing_date = ?
       WHERE id = ?`,
      [hearing_date, id]
    );

    // Notify employee
    try {
      await createNotification({
        recipientId: appeals[0].employee_id,
        senderId: user.id,
        title: 'Appeal Under Review',
        message: hearing_date 
          ? `Your appeal is under review. Hearing scheduled for ${hearing_date}.`
          : 'Your performance rating appeal is now under review by the PMT.',
        type: 'appeal_review',
        referenceId: id
      });
    } catch (notifyErr) {
      // Silent fail
    }

    res.json({ success: true, message: 'Appeal is now under review' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review appeal' });
  }
};

export const decideAppeal = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { decision, new_rating, decision_remarks } = req.body;
    const user = req.user;

    if (user.role !== 'admin' && user.role !== 'hr') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const [appeals] = await connection.query('SELECT * FROM spms_appeals WHERE id = ?', [id]);
    if (appeals.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    const appeal = appeals[0];

    // CSC requires decision within 1 month
    const newAdjectival = new_rating ? getAdjectivalRating(new_rating) : null;

    await connection.query(
      `UPDATE spms_appeals SET 
        status = 'Decided',
        pmt_decision = ?,
        new_rating = ?,
        new_adjectival = ?,
        decision_date = CURDATE(),
        decision_remarks = ?,
        decided_by = ?
       WHERE id = ?`,
      [decision, new_rating, newAdjectival, decision_remarks, user.id, id]
    );

    // If rating was modified or reversed, update the IPCR
    if ((decision === 'Modified' || decision === 'Reversed') && new_rating) {
      await connection.query(
        `UPDATE spms_ipcr SET 
          final_rating = ?,
          adjectival_rating = ?
         WHERE id = ?`,
        [new_rating, newAdjectival, appeal.ipcr_id]
      );
    }

    // Notify employee of decision
    try {
      await createNotification({
        recipientId: appeal.employee_id,
        senderId: user.id,
        title: 'Appeal Decision',
        message: `Your performance appeal has been decided: ${decision}. ${
          decision === 'Modified' ? `New rating: ${new_rating} (${newAdjectival})` : ''
        }`,
        type: 'appeal_decided',
        referenceId: id
      });
    } catch (notifyErr) {
      // Silent fail
    }

    await connection.commit();
    res.json({ success: true, message: 'Appeal decision recorded' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to decide appeal' });
  } finally {
    connection.release();
  }
};

export const withdrawAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [appeals] = await db.query('SELECT * FROM spms_appeals WHERE id = ?', [id]);
    if (appeals.length === 0) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    if (appeals[0].employee_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (appeals[0].status === 'Decided') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw a decided appeal' });
    }

    await db.query("UPDATE spms_appeals SET status = 'Withdrawn' WHERE id = ?", [id]);
    await db.query('UPDATE spms_ipcr SET appeal_filed = FALSE WHERE id = ?', [appeals[0].ipcr_id]);

    res.json({ success: true, message: 'Appeal withdrawn' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to withdraw appeal' });
  }
};

// Helper
const getAdjectivalRating = (rating) => {
  if (rating >= 4.50) return 'Outstanding';
  if (rating >= 3.50) return 'Very Satisfactory';
  if (rating >= 2.50) return 'Satisfactory';
  if (rating >= 1.50) return 'Unsatisfactory';
  return 'Poor';
};
