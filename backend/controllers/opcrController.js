/**
 * OPCR Controller (Office Performance Commitment and Review)
 * CSC MC 6 Series 2012 Compliance
 */

import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getAdjectivalRating = (rating) => {
  if (rating >= 4.50) return 'Outstanding';
  if (rating >= 3.50) return 'Very Satisfactory';
  if (rating >= 2.50) return 'Satisfactory';
  if (rating >= 1.50) return 'Unsatisfactory';
  return 'Poor';
};

const logOPCRActivity = async (opcrId, action, performedBy, oldStatus, newStatus, remarks = null) => {
  try {
    await db.query(
      `INSERT INTO spms_opcr_logs (opcr_id, action, performed_by, old_status, new_status, remarks) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [opcrId, action, performedBy, oldStatus, newStatus, remarks]
    );
  } catch (error) {
    // Silent fail for logging
  }
};

// =====================================================
// OPCR CRUD
// =====================================================

export const getOPCRs = async (req, res) => {
  try {
    const { cycle_id, department, status } = req.query;
    
    let query = `
      SELECT 
        o.*,
        p.first_name as prepared_by_first,
        p.last_name as prepared_by_last,
        a.first_name as approved_by_first,
        a.last_name as approved_by_last,
        c.title as cycle_title,
        c.year as cycle_year,
        c.period as cycle_period,
        (SELECT COUNT(*) FROM spms_opcr_items WHERE opcr_id = o.id) as item_count,
        (SELECT COUNT(*) FROM spms_ipcr WHERE opcr_id = o.id) as linked_ipcr_count
      FROM spms_opcr o
      JOIN authentication p ON o.prepared_by = p.id
      LEFT JOIN authentication a ON o.approved_by = a.id
      JOIN spms_cycles c ON o.cycle_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (cycle_id) {
      query += ' AND o.cycle_id = ?';
      params.push(cycle_id);
    }
    if (department) {
      query += ' AND o.department = ?';
      params.push(department);
    }
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.year DESC, o.department';

    const [opcrs] = await db.query(query, params);
    res.json({ success: true, opcrs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch OPCRs' });
  }
};

export const getOPCR = async (req, res) => {
  try {
    const { id } = req.params;

    const [opcrs] = await db.query(`
      SELECT 
        o.*,
        p.first_name as prepared_by_first, p.last_name as prepared_by_last,
        r.first_name as reviewed_by_first, r.last_name as reviewed_by_last,
        a.first_name as approved_by_first, a.last_name as approved_by_last,
        c.title as cycle_title, c.year, c.period, c.start_date, c.end_date
      FROM spms_opcr o
      JOIN authentication p ON o.prepared_by = p.id
      LEFT JOIN authentication r ON o.reviewed_by = r.id
      LEFT JOIN authentication a ON o.approved_by = a.id
      JOIN spms_cycles c ON o.cycle_id = c.id
      WHERE o.id = ?
    `, [id]);

    if (opcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'OPCR not found' });
    }

    const opcr = opcrs[0];

    // Get items
    const [items] = await db.query(`
      SELECT oi.*, m.title as mfo_title, m.description as mfo_description
      FROM spms_opcr_items oi
      LEFT JOIN spms_mfo m ON oi.mfo_id = m.id
      WHERE oi.opcr_id = ?
      ORDER BY oi.sort_order, oi.id
    `, [id]);

    // Get logs
    const [logs] = await db.query(`
      SELECT l.*, a.first_name, a.last_name
      FROM spms_opcr_logs l
      JOIN authentication a ON l.performed_by = a.id
      WHERE l.opcr_id = ?
      ORDER BY l.created_at DESC
    `, [id]);

    // Get linked IPCRs summary
    const [ipcrSummary] = await db.query(`
      SELECT 
        COUNT(*) as total,
        AVG(final_rating) as avg_rating,
        SUM(CASE WHEN status = 'Finalized' THEN 1 ELSE 0 END) as finalized_count
      FROM spms_ipcr 
      WHERE opcr_id = ?
    `, [id]);

    opcr.items = items;
    opcr.logs = logs;
    opcr.ipcr_summary = ipcrSummary[0];

    res.json({ success: true, opcr });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch OPCR' });
  }
};

export const createOPCR = async (req, res) => {
  try {
    const { department, cycle_id, total_budget } = req.body;
    const preparedBy = req.user?.id;

    // Check for existing OPCR
    const [existing] = await db.query(
      'SELECT id FROM spms_opcr WHERE department = ? AND cycle_id = ?',
      [department, cycle_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'OPCR already exists for this department and cycle' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO spms_opcr (department, cycle_id, prepared_by, total_budget) 
       VALUES (?, ?, ?, ?)`,
      [department, cycle_id, preparedBy, total_budget || 0]
    );

    await logOPCRActivity(result.insertId, 'Created', preparedBy, null, 'Draft', 'OPCR initialized');

    res.status(201).json({ 
      success: true, 
      message: 'OPCR created successfully',
      opcrId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create OPCR' });
  }
};

export const updateOPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_budget, actual_expenses, remarks } = req.body;

    await db.query(
      `UPDATE spms_opcr SET 
        total_budget = COALESCE(?, total_budget),
        actual_expenses = COALESCE(?, actual_expenses),
        pmt_remarks = COALESCE(?, pmt_remarks)
       WHERE id = ?`,
      [total_budget, actual_expenses, remarks, id]
    );

    res.json({ success: true, message: 'OPCR updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update OPCR' });
  }
};

export const deleteOPCR = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deletion of Draft OPCRs
    const [opcrs] = await db.query('SELECT status FROM spms_opcr WHERE id = ?', [id]);
    if (opcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'OPCR not found' });
    }

    if (opcrs[0].status !== 'Draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only Draft OPCRs can be deleted' 
      });
    }

    await db.query('DELETE FROM spms_opcr WHERE id = ?', [id]);
    res.json({ success: true, message: 'OPCR deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete OPCR' });
  }
};

// =====================================================
// OPCR ITEMS
// =====================================================

export const addOPCRItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      mfo_id, program_project, output_description, success_indicator, 
      target, budget_allocation, weight, responsible_unit, responsible_person 
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO spms_opcr_items 
       (opcr_id, mfo_id, program_project, output_description, success_indicator, 
        target, budget_allocation, weight, responsible_unit, responsible_person) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mfo_id, program_project, output_description, success_indicator, 
       target, budget_allocation || 0, weight || 10, responsible_unit, responsible_person]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Item added successfully',
      itemId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

export const updateOPCRItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { 
      mfo_id, program_project, output_description, success_indicator, target,
      budget_allocation, actual_accomplishment, actual_expenses,
      rating_quality, rating_efficiency, rating_timeliness, weight, 
      responsible_unit, responsible_person, remarks 
    } = req.body;

    // Calculate average if ratings provided
    let average_rating = null;
    if (rating_quality && rating_efficiency && rating_timeliness) {
      average_rating = ((parseFloat(rating_quality) + parseFloat(rating_efficiency) + parseFloat(rating_timeliness)) / 3).toFixed(2);
    }

    await db.query(
      `UPDATE spms_opcr_items SET 
        mfo_id = COALESCE(?, mfo_id),
        program_project = COALESCE(?, program_project),
        output_description = COALESCE(?, output_description),
        success_indicator = COALESCE(?, success_indicator),
        target = COALESCE(?, target),
        budget_allocation = COALESCE(?, budget_allocation),
        actual_accomplishment = COALESCE(?, actual_accomplishment),
        actual_expenses = COALESCE(?, actual_expenses),
        rating_quality = COALESCE(?, rating_quality),
        rating_efficiency = COALESCE(?, rating_efficiency),
        rating_timeliness = COALESCE(?, rating_timeliness),
        average_rating = COALESCE(?, average_rating),
        weight = COALESCE(?, weight),
        responsible_unit = COALESCE(?, responsible_unit),
        responsible_person = COALESCE(?, responsible_person),
        remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [mfo_id, program_project, output_description, success_indicator, target,
       budget_allocation, actual_accomplishment, actual_expenses,
       rating_quality, rating_efficiency, rating_timeliness, average_rating, weight,
       responsible_unit, responsible_person, remarks, itemId]
    );

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

export const deleteOPCRItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await db.query('DELETE FROM spms_opcr_items WHERE id = ?', [itemId]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

// =====================================================
// OPCR WORKFLOW
// =====================================================

export const submitOPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [opcrs] = await db.query('SELECT * FROM spms_opcr WHERE id = ?', [id]);
    if (opcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'OPCR not found' });
    }

    const opcr = opcrs[0];

    if (opcr.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'OPCR must be in Draft status' });
    }

    // Check if there are items
    const [items] = await db.query('SELECT COUNT(*) as count FROM spms_opcr_items WHERE opcr_id = ?', [id]);
    if (items[0].count === 0) {
      return res.status(400).json({ success: false, message: 'OPCR must have at least one target' });
    }

    await db.query(
      "UPDATE spms_opcr SET status = 'Submitted', date_submitted = CURDATE() WHERE id = ?",
      [id]
    );

    await logOPCRActivity(id, 'Submitted', user.id, 'Draft', 'Submitted', 'Submitted to PMT for review');

    res.json({ success: true, message: 'OPCR submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit OPCR' });
  }
};

export const reviewOPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const user = req.user;

    const [opcrs] = await db.query('SELECT * FROM spms_opcr WHERE id = ?', [id]);
    if (opcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'OPCR not found' });
    }

    if (opcrs[0].status !== 'Submitted') {
      return res.status(400).json({ success: false, message: 'OPCR must be in Submitted status' });
    }

    await db.query(
      `UPDATE spms_opcr SET 
        status = 'PMT Review', 
        reviewed_by = ?, 
        date_reviewed = CURDATE(),
        pmt_remarks = ?
       WHERE id = ?`,
      [user.id, remarks, id]
    );

    await logOPCRActivity(id, 'PMT Review Started', user.id, 'Submitted', 'PMT Review', remarks);

    res.json({ success: true, message: 'OPCR is now under PMT review' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review OPCR' });
  }
};

export const approveOPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const user = req.user;

    const [opcrs] = await db.query('SELECT * FROM spms_opcr WHERE id = ?', [id]);
    if (opcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'OPCR not found' });
    }

    if (opcrs[0].status !== 'PMT Review') {
      return res.status(400).json({ success: false, message: 'OPCR must be in PMT Review status' });
    }

    await db.query(
      `UPDATE spms_opcr SET 
        status = 'Approved', 
        approved_by = ?, 
        date_approved = CURDATE(),
        approver_remarks = ?
       WHERE id = ?`,
      [user.id, remarks, id]
    );

    await logOPCRActivity(id, 'Approved', user.id, 'PMT Review', 'Approved', remarks);

    res.json({ success: true, message: 'OPCR approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve OPCR' });
  }
};

export const finalizeOPCR = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const user = req.user;

    const [opcrs] = await connection.query('SELECT * FROM spms_opcr WHERE id = ?', [id]);
    if (opcrs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'OPCR not found' });
    }

    if (opcrs[0].status !== 'Approved') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'OPCR must be approved before finalizing' });
    }

    // Calculate final rating from items
    const [items] = await connection.query(`
      SELECT SUM(average_rating * weight) / SUM(weight) as weighted_avg
      FROM spms_opcr_items 
      WHERE opcr_id = ? AND average_rating IS NOT NULL
    `, [id]);

    const finalRating = items[0].weighted_avg ? parseFloat(items[0].weighted_avg).toFixed(2) : null;
    const adjectival = finalRating ? getAdjectivalRating(finalRating) : null;

    await connection.query(
      `UPDATE spms_opcr SET 
        status = 'Finalized', 
        final_rating = ?,
        adjectival_rating = ?
       WHERE id = ?`,
      [finalRating, adjectival, id]
    );

    // Update linked IPCRs with OPCR ceiling
    await connection.query(
      'UPDATE spms_ipcr SET opcr_ceiling_rating = ? WHERE opcr_id = ?',
      [finalRating, id]
    );

    await logOPCRActivity(id, 'Finalized', user.id, 'Approved', 'Finalized', 
      `Final Rating: ${finalRating} (${adjectival})`);

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'OPCR finalized successfully',
      finalRating,
      adjectival
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to finalize OPCR' });
  } finally {
    connection.release();
  }
};

// =====================================================
// IPCR-OPCR VALIDATION
// =====================================================

export const validateIPCRAgainstOPCR = async (req, res) => {
  try {
    const { ipcr_id } = req.params;

    // Get IPCR with its rating
    const [ipcrs] = await db.query(`
      SELECT i.*, o.final_rating as opcr_rating, o.adjectival_rating as opcr_adjectival
      FROM spms_ipcr i
      LEFT JOIN spms_opcr o ON i.opcr_id = o.id
      WHERE i.id = ?
    `, [ipcr_id]);

    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    if (!ipcr.opcr_id) {
      return res.json({ 
        success: true, 
        valid: true, 
        message: 'No OPCR linked - validation skipped' 
      });
    }

    if (!ipcr.opcr_rating) {
      return res.json({ 
        success: true, 
        valid: true, 
        message: 'OPCR not finalized yet - validation skipped' 
      });
    }

    const isValid = !ipcr.final_rating || ipcr.final_rating <= ipcr.opcr_rating;

    res.json({
      success: true,
      valid: isValid,
      ipcr_rating: ipcr.final_rating,
      opcr_ceiling: ipcr.opcr_rating,
      message: isValid 
        ? 'IPCR rating is within OPCR ceiling' 
        : `IPCR rating (${ipcr.final_rating}) exceeds OPCR ceiling (${ipcr.opcr_rating})`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Validation failed' });
  }
};

export const getDepartmentRatingAverage = async (req, res) => {
  try {
    const { department, cycle_id } = req.query;

    const [result] = await db.query(`
      SELECT 
        e.department,
        COUNT(i.id) as ipcr_count,
        AVG(i.final_rating) as avg_rating,
        o.final_rating as opcr_rating,
        CASE 
          WHEN AVG(i.final_rating) > o.final_rating THEN 'EXCEEDS'
          ELSE 'VALID'
        END as validation_status
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      LEFT JOIN spms_opcr o ON o.department = e.department AND o.cycle_id = i.cycle_id
      WHERE e.department = ? AND i.cycle_id = ?
      GROUP BY e.department, o.final_rating
    `, [department, cycle_id]);

    res.json({ success: true, summary: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get average' });
  }
};
