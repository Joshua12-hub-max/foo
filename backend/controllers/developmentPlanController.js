import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

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
// DEVELOPMENT PLAN CRUD
// =====================================================

// Get all development plans with filters
export const getDevelopmentPlans = async (req, res) => {
  try {
    const { employee_id, cycle_id, status, department } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        d.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        e.employee_id as employee_code,
        c.title as cycle_title,
        c.year as cycle_year,
        c.period as cycle_period,
        i.adjectival_rating as ipcr_rating,
        creator.first_name as created_by_first_name,
        creator.last_name as created_by_last_name,
        approver.first_name as approved_by_first_name,
        approver.last_name as approved_by_last_name
      FROM spms_development_plans d
      JOIN authentication e ON d.employee_id = e.id
      JOIN spms_cycles c ON d.cycle_id = c.id
      LEFT JOIN spms_ipcr i ON d.ipcr_id = i.id
      LEFT JOIN authentication creator ON d.created_by = creator.id
      LEFT JOIN authentication approver ON d.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (user.role !== 'admin' && user.role !== 'hr') {
      query += ' AND d.employee_id = ?';
      params.push(user.id);
    }

    if (employee_id) {
      query += ' AND d.employee_id = ?';
      params.push(employee_id);
    }

    if (cycle_id) {
      query += ' AND d.cycle_id = ?';
      params.push(cycle_id);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    query += ' ORDER BY d.created_at DESC';

    const [plans] = await db.query(query, params);
    res.json({ success: true, developmentPlans: plans });
  } catch (error) {
    console.error('Get Development Plans Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch development plans' });
  }
};

// Get single development plan
export const getDevelopmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [plans] = await db.query(`
      SELECT 
        d.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        c.title as cycle_title,
        c.year as cycle_year,
        i.adjectival_rating as ipcr_rating
      FROM spms_development_plans d
      JOIN authentication e ON d.employee_id = e.id
      JOIN spms_cycles c ON d.cycle_id = c.id
      LEFT JOIN spms_ipcr i ON d.ipcr_id = i.id
      WHERE d.id = ?
    `, [id]);

    if (plans.length === 0) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    const plan = plans[0];

    // Security check
    if (user.role !== 'admin' && user.role !== 'hr' && plan.employee_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Get associated training needs
    const [trainings] = await db.query(
      'SELECT * FROM spms_training_needs WHERE development_plan_id = ?',
      [id]
    );
    plan.trainings = trainings;

    res.json({ success: true, developmentPlan: plan });
  } catch (error) {
    console.error('Get Development Plan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch development plan' });
  }
};

// Create development plan
export const createDevelopmentPlan = async (req, res) => {
  try {
    const {
      employee_id,
      ipcr_id,
      cycle_id,
      competency_gap,
      current_proficiency_level,
      target_proficiency_level,
      development_objective,
      development_activities,
      resources_needed,
      start_date,
      target_completion_date,
      milestones
    } = req.body;
    const user = req.user;

    // Validate required fields
    if (!employee_id || !cycle_id || !competency_gap || !development_objective || !start_date || !target_completion_date) {
      return res.status(400).json({
        success: false,
        message: 'Employee, cycle, competency gap, objective, start date, and target completion date are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO spms_development_plans 
       (employee_id, ipcr_id, cycle_id, competency_gap, current_proficiency_level,
        target_proficiency_level, development_objective, development_activities,
        resources_needed, start_date, target_completion_date, milestones, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`,
      [
        employee_id,
        ipcr_id || null,
        cycle_id,
        competency_gap,
        current_proficiency_level || 'Developing',
        target_proficiency_level || 'Proficient',
        development_objective,
        development_activities || null,
        resources_needed || null,
        start_date,
        target_completion_date,
        milestones ? JSON.stringify(milestones) : null,
        user.id
      ]
    );

    await logMonitoringActivity('development_plan', result.insertId, 'Created', user.id, null, 'Draft');

    // Send notification to employee about new development plan
    try {
      await createNotification({
        recipientId: employee_id,
        senderId: user.id,
        title: 'Development Plan Created',
        message: `A Professional Development Plan has been created for you: ${competency_gap}. Please review the objectives and activities.`,
        type: 'pdp_created',
        referenceId: result.insertId
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Development plan created successfully',
      planId: result.insertId
    });
  } catch (error) {
    console.error('Create Development Plan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create development plan' });
  }
};

// Update development plan
export const updateDevelopmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      competency_gap,
      current_proficiency_level,
      target_proficiency_level,
      development_objective,
      development_activities,
      resources_needed,
      start_date,
      target_completion_date,
      actual_completion_date,
      progress_percentage,
      progress_notes,
      milestones,
      status
    } = req.body;
    const user = req.user;

    // Get current plan for status tracking
    const [existing] = await db.query('SELECT * FROM spms_development_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    const oldStatus = existing[0].status;

    await db.query(
      `UPDATE spms_development_plans SET
        competency_gap = COALESCE(?, competency_gap),
        current_proficiency_level = COALESCE(?, current_proficiency_level),
        target_proficiency_level = COALESCE(?, target_proficiency_level),
        development_objective = COALESCE(?, development_objective),
        development_activities = COALESCE(?, development_activities),
        resources_needed = COALESCE(?, resources_needed),
        start_date = COALESCE(?, start_date),
        target_completion_date = COALESCE(?, target_completion_date),
        actual_completion_date = COALESCE(?, actual_completion_date),
        progress_percentage = COALESCE(?, progress_percentage),
        progress_notes = COALESCE(?, progress_notes),
        milestones = COALESCE(?, milestones),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        competency_gap,
        current_proficiency_level,
        target_proficiency_level,
        development_objective,
        development_activities,
        resources_needed,
        start_date,
        target_completion_date,
        actual_completion_date,
        progress_percentage,
        progress_notes,
        milestones ? JSON.stringify(milestones) : null,
        status,
        id
      ]
    );

    if (status && status !== oldStatus) {
      await logMonitoringActivity('development_plan', id, 'Status Changed', user.id, oldStatus, status);
    }

    res.json({ success: true, message: 'Development plan updated successfully' });
  } catch (error) {
    console.error('Update Development Plan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update development plan' });
  }
};

// Approve development plan
export const approveDevelopmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Only admin or HR can approve plans' });
    }

    const [existing] = await db.query('SELECT * FROM spms_development_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    await db.query(
      `UPDATE spms_development_plans SET
        status = 'Active',
        approved_by = ?,
        approved_at = NOW()
       WHERE id = ?`,
      [user.id, id]
    );

    await logMonitoringActivity('development_plan', id, 'Approved', user.id, existing[0].status, 'Active');

    // Send notification to employee about approved plan
    try {
      await createNotification({
        recipientId: existing[0].employee_id,
        senderId: user.id,
        title: 'Development Plan Approved',
        message: 'Your Professional Development Plan has been approved and is now active. Please start working on your development activities.',
        type: 'pdp_approved',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'Development plan approved' });
  } catch (error) {
    console.error('Approve Development Plan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve development plan' });
  }
};

// Complete development plan
export const completeDevelopmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_notes } = req.body;
    const user = req.user;

    const [existing] = await db.query('SELECT * FROM spms_development_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    await db.query(
      `UPDATE spms_development_plans SET
        status = 'Completed',
        progress_percentage = 100,
        actual_completion_date = CURDATE(),
        progress_notes = COALESCE(?, progress_notes)
       WHERE id = ?`,
      [progress_notes, id]
    );

    await logMonitoringActivity('development_plan', id, 'Completed', user.id, existing[0].status, 'Completed');

    res.json({ success: true, message: 'Development plan completed' });
  } catch (error) {
    console.error('Complete Development Plan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete development plan' });
  }
};

// Get employee's own development plans
export const getMyDevelopmentPlans = async (req, res) => {
  try {
    const user = req.user;

    const [plans] = await db.query(`
      SELECT 
        d.*,
        c.title as cycle_title,
        c.year as cycle_year
      FROM spms_development_plans d
      JOIN spms_cycles c ON d.cycle_id = c.id
      WHERE d.employee_id = ?
      ORDER BY d.created_at DESC
    `, [user.id]);

    res.json({ success: true, developmentPlans: plans });
  } catch (error) {
    console.error('Get My Development Plans Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch development plans' });
  }
};

// Update progress
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percentage, progress_notes } = req.body;
    const user = req.user;

    const [existing] = await db.query('SELECT * FROM spms_development_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    // Employee can update their own progress
    if (existing[0].employee_id !== user.id && user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Unauthorized to update progress' });
    }

    await db.query(
      `UPDATE spms_development_plans SET
        progress_percentage = ?,
        progress_notes = CONCAT(COALESCE(progress_notes, ''), '\n[', NOW(), '] ', ?)
       WHERE id = ?`,
      [progress_percentage, progress_notes || 'Progress updated', id]
    );

    await logMonitoringActivity('development_plan', id, 'Progress Updated', user.id, null, null, { progress: progress_percentage });

    res.json({ success: true, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Update Progress Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
};

// Delete development plan
export const deleteDevelopmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only admin/hr can delete
    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Only admin or HR can delete development plans' });
    }

    // Check if plan exists
    const [existing] = await db.query('SELECT * FROM spms_development_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    // Don't allow deleting completed or active plans
    if (existing[0].status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot delete completed development plans' });
    }

    // Delete the plan
    await db.query('DELETE FROM spms_development_plans WHERE id = ?', [id]);

    // Log activity
    await logMonitoringActivity('development_plan', id, 'Deleted', user.id, existing[0].status, 'Deleted', 
      { plan_title: existing[0].plan_title, employee_id: existing[0].employee_id }
    );

    res.json({ success: true, message: 'Development plan deleted successfully' });
  } catch (error) {
    console.error('Delete Development Plan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete development plan' });
  }
};

// Get development plan statistics
export const getDevelopmentPlanStats = async (req, res) => {
  try {
    const { department, cycle_id } = req.query;

    let where = '1=1';
    const params = [];

    if (department) {
      where += ' AND e.department = ?';
      params.push(department);
    }

    if (cycle_id) {
      where += ' AND d.cycle_id = ?';
      params.push(cycle_id);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_plans,
        SUM(CASE WHEN d.status = 'Active' THEN 1 ELSE 0 END) as active_plans,
        SUM(CASE WHEN d.status = 'Completed' THEN 1 ELSE 0 END) as completed_plans,
        SUM(CASE WHEN d.status = 'Draft' OR d.status = 'Pending Approval' THEN 1 ELSE 0 END) as pending_plans,
        AVG(d.progress_percentage) as avg_progress,
        COUNT(DISTINCT d.employee_id) as employees_with_plans
      FROM spms_development_plans d
      JOIN authentication e ON d.employee_id = e.id
      WHERE ${where}
    `, params);

    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Get Development Plan Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
