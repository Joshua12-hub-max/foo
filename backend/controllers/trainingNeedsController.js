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
// TRAINING NEEDS CRUD
// =====================================================

// Get all training needs with filters
export const getTrainingNeeds = async (req, res) => {
  try {
    const { employee_id, training_type, status, priority, department } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        t.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        e.employee_id as employee_code,
        recommender.first_name as recommended_by_first_name,
        recommender.last_name as recommended_by_last_name,
        verifier.first_name as verified_by_first_name,
        verifier.last_name as verified_by_last_name,
        d.competency_gap as pdp_competency_gap
      FROM spms_training_needs t
      JOIN authentication e ON t.employee_id = e.id
      JOIN authentication recommender ON t.recommended_by = recommender.id
      LEFT JOIN authentication verifier ON t.verified_by = verifier.id
      LEFT JOIN spms_development_plans d ON t.development_plan_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (user.role !== 'admin' && user.role !== 'hr') {
      query += ' AND t.employee_id = ?';
      params.push(user.id);
    }

    if (employee_id) {
      query += ' AND t.employee_id = ?';
      params.push(employee_id);
    }

    if (training_type) {
      query += ' AND t.training_type = ?';
      params.push(training_type);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    query += ' ORDER BY FIELD(t.priority, "Critical", "High", "Medium", "Low"), t.created_at DESC';

    const [trainings] = await db.query(query, params);
    res.json({ success: true, trainingNeeds: trainings });
  } catch (error) {
    console.error('Get Training Needs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training needs' });
  }
};

// Get single training need
export const getTrainingNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [trainings] = await db.query(`
      SELECT 
        t.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.department as employee_department,
        recommender.first_name as recommended_by_first_name,
        recommender.last_name as recommended_by_last_name
      FROM spms_training_needs t
      JOIN authentication e ON t.employee_id = e.id
      JOIN authentication recommender ON t.recommended_by = recommender.id
      WHERE t.id = ?
    `, [id]);

    if (trainings.length === 0) {
      return res.status(404).json({ success: false, message: 'Training need not found' });
    }

    const training = trainings[0];

    // Security check
    if (user.role !== 'admin' && user.role !== 'hr' && training.employee_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    res.json({ success: true, trainingNeed: training });
  } catch (error) {
    console.error('Get Training Need Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training need' });
  }
};

// Create training need
export const createTrainingNeed = async (req, res) => {
  try {
    const {
      employee_id,
      ipcr_id,
      development_plan_id,
      training_type,
      training_title,
      training_description,
      training_provider,
      priority,
      is_mandatory,
      scheduled_date,
      pre_training_assessment,
      remarks
    } = req.body;
    const user = req.user;

    // Validate required fields
    if (!employee_id || !training_title) {
      return res.status(400).json({
        success: false,
        message: 'Employee and training title are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO spms_training_needs 
       (employee_id, ipcr_id, development_plan_id, training_type, training_title,
        training_description, training_provider, priority, is_mandatory,
        scheduled_date, pre_training_assessment, remarks, recommended_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Recommended')`,
      [
        employee_id,
        ipcr_id || null,
        development_plan_id || null,
        training_type || 'Technical',
        training_title,
        training_description || null,
        training_provider || null,
        priority || 'Medium',
        is_mandatory || false,
        scheduled_date || null,
        pre_training_assessment || null,
        remarks || null,
        user.id
      ]
    );

    await logMonitoringActivity('training', result.insertId, 'Created', user.id, null, 'Recommended');

    res.status(201).json({
      success: true,
      message: 'Training need created successfully',
      trainingNeedId: result.insertId
    });
  } catch (error) {
    console.error('Create Training Need Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create training need' });
  }
};

// Update training need
export const updateTrainingNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      training_type,
      training_title,
      training_description,
      training_provider,
      priority,
      is_mandatory,
      status,
      scheduled_date,
      completion_date,
      pre_training_assessment,
      post_training_assessment,
      effectiveness_rating,
      remarks
    } = req.body;
    const user = req.user;

    // Get current training for status tracking
    const [existing] = await db.query('SELECT * FROM spms_training_needs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Training need not found' });
    }

    const oldStatus = existing[0].status;

    await db.query(
      `UPDATE spms_training_needs SET
        training_type = COALESCE(?, training_type),
        training_title = COALESCE(?, training_title),
        training_description = COALESCE(?, training_description),
        training_provider = COALESCE(?, training_provider),
        priority = COALESCE(?, priority),
        is_mandatory = COALESCE(?, is_mandatory),
        status = COALESCE(?, status),
        scheduled_date = COALESCE(?, scheduled_date),
        completion_date = COALESCE(?, completion_date),
        pre_training_assessment = COALESCE(?, pre_training_assessment),
        post_training_assessment = COALESCE(?, post_training_assessment),
        effectiveness_rating = COALESCE(?, effectiveness_rating),
        remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [
        training_type,
        training_title,
        training_description,
        training_provider,
        priority,
        is_mandatory,
        status,
        scheduled_date,
        completion_date,
        pre_training_assessment,
        post_training_assessment,
        effectiveness_rating,
        remarks,
        id
      ]
    );

    if (status && status !== oldStatus) {
      await logMonitoringActivity('training', id, 'Status Changed', user.id, oldStatus, status);
    }

    res.json({ success: true, message: 'Training need updated successfully' });
  } catch (error) {
    console.error('Update Training Need Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update training need' });
  }
};

// Approve training need
export const approveTrainingNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Only admin or HR can approve trainings' });
    }

    const [existing] = await db.query('SELECT * FROM spms_training_needs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Training need not found' });
    }

    await db.query(
      "UPDATE spms_training_needs SET status = 'Approved' WHERE id = ?",
      [id]
    );

    await logMonitoringActivity('training', id, 'Approved', user.id, existing[0].status, 'Approved');

    res.json({ success: true, message: 'Training approved' });
  } catch (error) {
    console.error('Approve Training Need Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve training' });
  }
};

// Schedule training
export const scheduleTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, training_provider } = req.body;
    const user = req.user;

    if (!scheduled_date) {
      return res.status(400).json({ success: false, message: 'Scheduled date is required' });
    }

    const [existing] = await db.query('SELECT * FROM spms_training_needs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Training need not found' });
    }

    await db.query(
      `UPDATE spms_training_needs SET 
        status = 'Scheduled',
        scheduled_date = ?,
        training_provider = COALESCE(?, training_provider)
       WHERE id = ?`,
      [scheduled_date, training_provider, id]
    );

    await logMonitoringActivity('training', id, 'Scheduled', user.id, existing[0].status, 'Scheduled');

    // Send notification to employee about scheduled training
    try {
      const schedDate = new Date(scheduled_date).toLocaleDateString();
      await createNotification({
        recipientId: existing[0].employee_id,
        senderId: user.id,
        title: 'Training Scheduled',
        message: `Training "${existing[0].training_title}" has been scheduled for ${schedDate}.`,
        type: 'training_scheduled',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'Training scheduled successfully' });
  } catch (error) {
    console.error('Schedule Training Error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule training' });
  }
};

// Complete training
export const completeTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_date, post_training_assessment, effectiveness_rating, certificate_file } = req.body;
    const user = req.user;

    const [existing] = await db.query('SELECT * FROM spms_training_needs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Training need not found' });
    }

    await db.query(
      `UPDATE spms_training_needs SET
        status = 'Completed',
        completion_date = COALESCE(?, CURDATE()),
        post_training_assessment = ?,
        effectiveness_rating = ?,
        certificate_file = ?,
        verified_by = ?,
        verified_at = NOW()
       WHERE id = ?`,
      [
        completion_date,
        post_training_assessment || null,
        effectiveness_rating || null,
        certificate_file || null,
        user.id,
        id
      ]
    );

    await logMonitoringActivity('training', id, 'Completed', user.id, existing[0].status, 'Completed');

    // Send notification to employee about completed training
    try {
      await createNotification({
        recipientId: existing[0].employee_id,
        senderId: user.id,
        title: 'Training Completed',
        message: `Training "${existing[0].training_title}" has been marked as completed. Great job!`,
        type: 'training_completed',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'Training marked as completed' });
  } catch (error) {
    console.error('Complete Training Error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete training' });
  }
};

// Delete training need
export const deleteTrainingNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [existing] = await db.query('SELECT * FROM spms_training_needs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Training need not found' });
    }

    // Only allow deletion of Recommended status
    if (existing[0].status !== 'Recommended') {
      return res.status(400).json({ success: false, message: 'Only recommended trainings can be deleted' });
    }

    await db.query('DELETE FROM spms_training_needs WHERE id = ?', [id]);

    await logMonitoringActivity('training', id, 'Deleted', user.id, existing[0].status, null);

    res.json({ success: true, message: 'Training need deleted successfully' });
  } catch (error) {
    console.error('Delete Training Need Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete training need' });
  }
};

// Get employee's own training needs
export const getMyTrainingNeeds = async (req, res) => {
  try {
    const user = req.user;

    const [trainings] = await db.query(`
      SELECT 
        t.*,
        recommender.first_name as recommended_by_first_name,
        recommender.last_name as recommended_by_last_name
      FROM spms_training_needs t
      JOIN authentication recommender ON t.recommended_by = recommender.id
      WHERE t.employee_id = ?
      ORDER BY FIELD(t.priority, "Critical", "High", "Medium", "Low"), t.created_at DESC
    `, [user.id]);

    res.json({ success: true, trainingNeeds: trainings });
  } catch (error) {
    console.error('Get My Training Needs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training needs' });
  }
};

// Get training statistics
export const getTrainingStats = async (req, res) => {
  try {
    const { department, training_type } = req.query;

    let where = '1=1';
    const params = [];

    if (department) {
      where += ' AND e.department = ?';
      params.push(department);
    }

    if (training_type) {
      where += ' AND t.training_type = ?';
      params.push(training_type);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_trainings,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_trainings,
        SUM(CASE WHEN t.status = 'Scheduled' OR t.status = 'In Progress' THEN 1 ELSE 0 END) as ongoing_trainings,
        SUM(CASE WHEN t.status = 'Recommended' OR t.status = 'Approved' THEN 1 ELSE 0 END) as pending_trainings,
        SUM(CASE WHEN t.is_mandatory = 1 THEN 1 ELSE 0 END) as mandatory_trainings,
        AVG(t.effectiveness_rating) as avg_effectiveness,
        COUNT(DISTINCT t.employee_id) as employees_enrolled
      FROM spms_training_needs t
      JOIN authentication e ON t.employee_id = e.id
      WHERE ${where}
    `, params);

    // Training by type breakdown
    const [byType] = await db.query(`
      SELECT 
        t.training_type,
        COUNT(*) as count,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM spms_training_needs t
      JOIN authentication e ON t.employee_id = e.id
      WHERE ${where}
      GROUP BY t.training_type
    `, params);

    res.json({ success: true, stats: stats[0], byType });
  } catch (error) {
    console.error('Get Training Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
