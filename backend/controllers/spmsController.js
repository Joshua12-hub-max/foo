import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Calculate adjectival rating from numerical rating
const getAdjectivalRating = (rating) => {
  if (rating >= 4.50) return 'Outstanding';
  if (rating >= 3.50) return 'Very Satisfactory';
  if (rating >= 2.50) return 'Satisfactory';
  if (rating >= 1.50) return 'Unsatisfactory';
  return 'Poor';
};

// Log IPCR activity
const logIPCRActivity = async (ipcrId, action, performedBy, oldStatus, newStatus, remarks = null) => {
  try {
    await db.query(
      `INSERT INTO spms_ipcr_logs (ipcr_id, action, performed_by, old_status, new_status, remarks) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ipcrId, action, performedBy, oldStatus, newStatus, remarks]
    );
  } catch (error) {
    console.error('Error logging IPCR activity:', error);
  }
};

// =====================================================
// CYCLE MANAGEMENT
// =====================================================

export const getCycles = async (req, res) => {
  try {
    const [cycles] = await db.query(`
      SELECT c.*, a.first_name, a.last_name 
      FROM spms_cycles c
      LEFT JOIN authentication a ON c.created_by = a.id
      ORDER BY c.year DESC, c.start_date DESC
    `);
    res.json({ success: true, cycles });
  } catch (error) {
    console.error('Get Cycles Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cycles' });
  }
};

export const getCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const [cycles] = await db.query('SELECT * FROM spms_cycles WHERE id = ?', [id]);
    
    if (cycles.length === 0) {
      return res.status(404).json({ success: false, message: 'Cycle not found' });
    }
    
    res.json({ success: true, cycle: cycles[0] });
  } catch (error) {
    console.error('Get Cycle Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cycle' });
  }
};

export const createCycle = async (req, res) => {
  try {
    const { title, year, period, start_date, end_date, description } = req.body;
    const createdBy = req.user?.id;

    const [result] = await db.query(
      `INSERT INTO spms_cycles (title, year, period, start_date, end_date, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, year, period, start_date, end_date, description, createdBy]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Cycle created successfully',
      cycleId: result.insertId 
    });
  } catch (error) {
    console.error('Create Cycle Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create cycle' });
  }
};

export const updateCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, year, period, start_date, end_date, status, description } = req.body;

    await db.query(
      `UPDATE spms_cycles SET title = ?, year = ?, period = ?, start_date = ?, end_date = ?, status = ?, description = ? 
       WHERE id = ?`,
      [title, year, period, start_date, end_date, status, description, id]
    );

    res.json({ success: true, message: 'Cycle updated successfully' });
  } catch (error) {
    console.error('Update Cycle Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update cycle' });
  }
};

export const deleteCycle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are IPCRs using this cycle
    const [ipcrs] = await db.query('SELECT COUNT(*) as count FROM spms_ipcr WHERE cycle_id = ?', [id]);
    if (ipcrs[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete cycle with existing IPCRs' 
      });
    }

    await db.query('DELETE FROM spms_cycles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Cycle deleted successfully' });
  } catch (error) {
    console.error('Delete Cycle Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete cycle' });
  }
};

// =====================================================
// MFO MANAGEMENT
// =====================================================

export const getMFOs = async (req, res) => {
  try {
    const { department } = req.query;
    let query = 'SELECT * FROM spms_mfo WHERE is_active = TRUE';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    query += ' ORDER BY department, title';
    const [mfos] = await db.query(query, params);
    res.json({ success: true, mfos });
  } catch (error) {
    console.error('Get MFOs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch MFOs' });
  }
};

export const createMFO = async (req, res) => {
  try {
    const { department, title, description, weight } = req.body;

    const [result] = await db.query(
      'INSERT INTO spms_mfo (department, title, description, weight) VALUES (?, ?, ?, ?)',
      [department, title, description, weight || 100]
    );

    res.status(201).json({ 
      success: true, 
      message: 'MFO created successfully',
      mfoId: result.insertId 
    });
  } catch (error) {
    console.error('Create MFO Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create MFO' });
  }
};

export const updateMFO = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, title, description, weight, is_active } = req.body;

    await db.query(
      'UPDATE spms_mfo SET department = ?, title = ?, description = ?, weight = ?, is_active = ? WHERE id = ?',
      [department, title, description, weight, is_active, id]
    );

    res.json({ success: true, message: 'MFO updated successfully' });
  } catch (error) {
    console.error('Update MFO Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update MFO' });
  }
};

export const deleteMFO = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE spms_mfo SET is_active = FALSE WHERE id = ?', [id]);
    res.json({ success: true, message: 'MFO deactivated successfully' });
  } catch (error) {
    console.error('Delete MFO Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete MFO' });
  }
};

// =====================================================
// KRA MANAGEMENT
// =====================================================

export const getKRAs = async (req, res) => {
  try {
    const { mfo_id } = req.query;
    let query = `
      SELECT k.*, m.title as mfo_title, m.department 
      FROM spms_kra k
      JOIN spms_mfo m ON k.mfo_id = m.id
      WHERE k.is_active = TRUE
    `;
    const params = [];

    if (mfo_id) {
      query += ' AND k.mfo_id = ?';
      params.push(mfo_id);
    }

    query += ' ORDER BY m.department, m.title, k.title';
    const [kras] = await db.query(query, params);
    res.json({ success: true, kras });
  } catch (error) {
    console.error('Get KRAs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch KRAs' });
  }
};

export const createKRA = async (req, res) => {
  try {
    const { mfo_id, title, description, weight } = req.body;

    const [result] = await db.query(
      'INSERT INTO spms_kra (mfo_id, title, description, weight) VALUES (?, ?, ?, ?)',
      [mfo_id, title, description, weight || 20]
    );

    res.status(201).json({ 
      success: true, 
      message: 'KRA created successfully',
      kraId: result.insertId 
    });
  } catch (error) {
    console.error('Create KRA Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create KRA' });
  }
};

export const updateKRA = async (req, res) => {
  try {
    const { id } = req.params;
    const { mfo_id, title, description, weight, is_active } = req.body;

    await db.query(
      'UPDATE spms_kra SET mfo_id = ?, title = ?, description = ?, weight = ?, is_active = ? WHERE id = ?',
      [mfo_id, title, description, weight, is_active, id]
    );

    res.json({ success: true, message: 'KRA updated successfully' });
  } catch (error) {
    console.error('Update KRA Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update KRA' });
  }
};

export const deleteKRA = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE spms_kra SET is_active = FALSE WHERE id = ?', [id]);
    res.json({ success: true, message: 'KRA deactivated successfully' });
  } catch (error) {
    console.error('Delete KRA Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete KRA' });
  }
};

// =====================================================
// COMPETENCIES MANAGEMENT
// =====================================================

export const getCompetencies = async (req, res) => {
  try {
    const [competencies] = await db.query(
      'SELECT * FROM spms_competencies WHERE is_active = TRUE ORDER BY category, name'
    );
    res.json({ success: true, competencies });
  } catch (error) {
    console.error('Get Competencies Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch competencies' });
  }
};

export const createCompetency = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const [result] = await db.query(
      'INSERT INTO spms_competencies (name, description, category) VALUES (?, ?, ?)',
      [name, description, category || 'Core']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Competency created successfully',
      competencyId: result.insertId 
    });
  } catch (error) {
    console.error('Create Competency Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create competency' });
  }
};

export const updateCompetency = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, is_active } = req.body;

    await db.query(
      'UPDATE spms_competencies SET name = ?, description = ?, category = ?, is_active = ? WHERE id = ?',
      [name, description, category, is_active, id]
    );

    res.json({ success: true, message: 'Competency updated successfully' });
  } catch (error) {
    console.error('Update Competency Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update competency' });
  }
};

// =====================================================
// IPCR MANAGEMENT
// =====================================================

export const getIPCRs = async (req, res) => {
  try {
    const { cycle_id, employee_id, status, department } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        i.*,
        e.first_name as employee_first_name, 
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        e.employee_id as employee_code,
        r.first_name as rater_first_name,
        r.last_name as rater_last_name,
        c.title as cycle_title,
        c.period as cycle_period,
        c.year as cycle_year
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      JOIN authentication r ON i.rater_id = r.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (user.role !== 'admin' && user.role !== 'hr') {
      // Employees can only see their own IPCRs
      // Supervisors can see their team's IPCRs (rater_id = user.id)
      query += ' AND (i.employee_id = ? OR i.rater_id = ?)';
      params.push(user.id, user.id);
    }

    if (cycle_id) {
      query += ' AND i.cycle_id = ?';
      params.push(cycle_id);
    }

    if (employee_id) {
      query += ' AND i.employee_id = ?';
      params.push(employee_id);
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    query += ' ORDER BY i.created_at DESC';

    const [ipcrs] = await db.query(query, params);
    res.json({ success: true, ipcrs });
  } catch (error) {
    console.error('Get IPCRs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IPCRs' });
  }
};

export const getIPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get IPCR with employee and rater info
    const [ipcrs] = await db.query(`
      SELECT 
        i.*,
        e.first_name as employee_first_name, 
        e.last_name as employee_last_name,
        e.department as employee_department,
        e.job_title as employee_job_title,
        e.employee_id as employee_code,
        e.avatar_url as employee_avatar,
        r.first_name as rater_first_name,
        r.last_name as rater_last_name,
        r.job_title as rater_job_title,
        a.first_name as approver_first_name,
        a.last_name as approver_last_name,
        c.title as cycle_title,
        c.period as cycle_period,
        c.year as cycle_year,
        c.start_date as cycle_start,
        c.end_date as cycle_end
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      JOIN authentication r ON i.rater_id = r.id
      LEFT JOIN authentication a ON i.approver_id = a.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    // Security check
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (ipcr.employee_id !== user.id && ipcr.rater_id !== user.id && ipcr.approver_id !== user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
    }

    // Get IPCR items
    const [items] = await db.query(`
      SELECT it.*, k.title as kra_title, k.weight as kra_weight
      FROM spms_ipcr_items it
      LEFT JOIN spms_kra k ON it.kra_id = k.id
      WHERE it.ipcr_id = ?
      ORDER BY it.sort_order, it.id
    `, [id]);

    // Get competency ratings
    const [competencies] = await db.query(`
      SELECT ic.*, c.name as competency_name, c.description as competency_description, c.category
      FROM spms_ipcr_competencies ic
      JOIN spms_competencies c ON ic.competency_id = c.id
      WHERE ic.ipcr_id = ?
      ORDER BY c.category, c.name
    `, [id]);

    // Get activity logs
    const [logs] = await db.query(`
      SELECT l.*, a.first_name, a.last_name
      FROM spms_ipcr_logs l
      JOIN authentication a ON l.performed_by = a.id
      WHERE l.ipcr_id = ?
      ORDER BY l.created_at DESC
    `, [id]);

    ipcr.items = items;
    ipcr.competencies = competencies;
    ipcr.logs = logs;

    res.json({ success: true, ipcr });
  } catch (error) {
    console.error('Get IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch IPCR' });
  }
};

export const createIPCR = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { employee_id, rater_id, approver_id, cycle_id } = req.body;
    const createdBy = req.user?.id;

    // Check for existing IPCR
    const [existing] = await connection.query(
      'SELECT id FROM spms_ipcr WHERE employee_id = ? AND cycle_id = ?',
      [employee_id, cycle_id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        success: false, 
        message: 'IPCR already exists for this employee in this cycle' 
      });
    }

    // Create IPCR
    const [result] = await connection.query(
      `INSERT INTO spms_ipcr (employee_id, rater_id, approver_id, cycle_id) 
       VALUES (?, ?, ?, ?)`,
      [employee_id, rater_id, approver_id, cycle_id]
    );

    const ipcrId = result.insertId;

    // Initialize competency ratings
    const [competencies] = await connection.query(
      'SELECT id FROM spms_competencies WHERE is_active = TRUE'
    );

    for (const comp of competencies) {
      await connection.query(
        'INSERT INTO spms_ipcr_competencies (ipcr_id, competency_id) VALUES (?, ?)',
        [ipcrId, comp.id]
      );
    }

    // Log activity
    await logIPCRActivity(ipcrId, 'IPCR Created', createdBy, null, 'Draft', 'IPCR initialized');

    await connection.commit();

    res.status(201).json({ 
      success: true, 
      message: 'IPCR created successfully',
      ipcrId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create IPCR' });
  } finally {
    connection.release();
  }
};

export const updateIPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { rater_id, approver_id, employee_remarks, rater_remarks, approver_remarks } = req.body;

    await db.query(
      `UPDATE spms_ipcr SET 
        rater_id = COALESCE(?, rater_id),
        approver_id = COALESCE(?, approver_id),
        employee_remarks = COALESCE(?, employee_remarks),
        rater_remarks = COALESCE(?, rater_remarks),
        approver_remarks = COALESCE(?, approver_remarks)
       WHERE id = ?`,
      [rater_id, approver_id, employee_remarks, rater_remarks, approver_remarks, id]
    );

    res.json({ success: true, message: 'IPCR updated successfully' });
  } catch (error) {
    console.error('Update IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update IPCR' });
  }
};

export const deleteIPCR = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deletion of Draft IPCRs
    const [ipcrs] = await db.query('SELECT status FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    if (ipcrs[0].status !== 'Draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only Draft IPCRs can be deleted' 
      });
    }

    await db.query('DELETE FROM spms_ipcr WHERE id = ?', [id]);
    res.json({ success: true, message: 'IPCR deleted successfully' });
  } catch (error) {
    console.error('Delete IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete IPCR' });
  }
};

// =====================================================
// IPCR ITEMS MANAGEMENT
// =====================================================

export const addIPCRItem = async (req, res) => {
  try {
    const { id } = req.params; // IPCR ID
    const { kra_id, output_description, success_indicator, target, weight } = req.body;

    const [result] = await db.query(
      `INSERT INTO spms_ipcr_items (ipcr_id, kra_id, output_description, success_indicator, target, weight) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, kra_id, output_description, success_indicator, target, weight || 10]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Item added successfully',
      itemId: result.insertId 
    });
  } catch (error) {
    console.error('Add IPCR Item Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

export const updateIPCRItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { 
      kra_id, output_description, success_indicator, target, weight,
      accomplishment, rating_quality, rating_efficiency, rating_timeliness, remarks 
    } = req.body;

    // Calculate average if ratings provided
    let average_rating = null;
    if (rating_quality && rating_efficiency && rating_timeliness) {
      average_rating = ((parseFloat(rating_quality) + parseFloat(rating_efficiency) + parseFloat(rating_timeliness)) / 3).toFixed(2);
    }

    await db.query(
      `UPDATE spms_ipcr_items SET 
        kra_id = COALESCE(?, kra_id),
        output_description = COALESCE(?, output_description),
        success_indicator = COALESCE(?, success_indicator),
        target = COALESCE(?, target),
        weight = COALESCE(?, weight),
        accomplishment = COALESCE(?, accomplishment),
        rating_quality = COALESCE(?, rating_quality),
        rating_efficiency = COALESCE(?, rating_efficiency),
        rating_timeliness = COALESCE(?, rating_timeliness),
        average_rating = COALESCE(?, average_rating),
        remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [kra_id, output_description, success_indicator, target, weight, 
       accomplishment, rating_quality, rating_efficiency, rating_timeliness, average_rating, remarks, itemId]
    );

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Update IPCR Item Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

export const deleteIPCRItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await db.query('DELETE FROM spms_ipcr_items WHERE id = ?', [itemId]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete IPCR Item Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

// =====================================================
// IPCR WORKFLOW ACTIONS
// =====================================================

// Employee commits their IPCR
export const commitIPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [ipcrs] = await db.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    // Verify employee owns this IPCR
    if (ipcr.employee_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the employee can commit their IPCR' });
    }

    if (ipcr.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'IPCR must be in Draft status to commit' });
    }

    // Check if there are items
    const [items] = await db.query('SELECT COUNT(*) as count FROM spms_ipcr_items WHERE ipcr_id = ?', [id]);
    if (items[0].count === 0) {
      return res.status(400).json({ success: false, message: 'IPCR must have at least one output/target' });
    }

    await db.query(
      "UPDATE spms_ipcr SET status = 'Committed', date_committed = CURDATE() WHERE id = ?",
      [id]
    );

    await logIPCRActivity(id, 'Committed', user.id, 'Draft', 'Committed', 'Employee committed performance targets');

    res.json({ success: true, message: 'IPCR committed successfully' });
  } catch (error) {
    console.error('Commit IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to commit IPCR' });
  }
};

// Employee submits accomplishments for rating
export const submitForRating = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [ipcrs] = await db.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    if (ipcr.employee_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the employee can submit for rating' });
    }

    if (ipcr.status !== 'Committed') {
      return res.status(400).json({ success: false, message: 'IPCR must be in Committed status' });
    }

    await db.query(
      "UPDATE spms_ipcr SET status = 'For Rating', date_submitted = CURDATE() WHERE id = ?",
      [id]
    );

    await logIPCRActivity(id, 'Submitted for Rating', user.id, 'Committed', 'For Rating', 'Employee submitted accomplishments');

    // Notify the rater that an IPCR is ready for rating
    try {
      await createNotification({
        recipientId: ipcr.rater_id,
        senderId: user.id,
        title: 'IPCR Ready for Rating',
        message: `An IPCR has been submitted for your review and rating.`,
        type: 'ipcr_submitted',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'IPCR submitted for rating successfully' });
  } catch (error) {
    console.error('Submit for Rating Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit for rating' });
  }
};

// Supervisor rates the IPCR
export const rateIPCR = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { items, rater_remarks } = req.body;
    const user = req.user;

    const [ipcrs] = await connection.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    // Verify rater
    if (ipcr.rater_id !== user.id && user.role !== 'admin' && user.role !== 'hr') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Only the assigned rater can rate this IPCR' });
    }

    if (ipcr.status !== 'For Rating') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'IPCR must be in For Rating status' });
    }

    // Update each item's rating
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const item of items) {
      const avgRating = ((parseFloat(item.rating_quality) + parseFloat(item.rating_efficiency) + parseFloat(item.rating_timeliness)) / 3);
      
      await connection.query(
        `UPDATE spms_ipcr_items SET 
          rating_quality = ?, rating_efficiency = ?, rating_timeliness = ?, 
          average_rating = ?, remarks = ?
         WHERE id = ?`,
        [item.rating_quality, item.rating_efficiency, item.rating_timeliness, avgRating.toFixed(2), item.remarks, item.id]
      );

      totalWeightedScore += avgRating * (item.weight || 10);
      totalWeight += (item.weight || 10);
    }

    // Calculate final average
    const finalAverage = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 0;
    const adjectivalRating = getAdjectivalRating(parseFloat(finalAverage));

    // Update IPCR
    await connection.query(
      `UPDATE spms_ipcr SET 
        status = 'Rated', 
        date_rated = CURDATE(),
        final_average_rating = ?,
        adjectival_rating = ?,
        rater_remarks = ?
       WHERE id = ?`,
      [finalAverage, adjectivalRating, rater_remarks, id]
    );

    await logIPCRActivity(id, 'Rated', user.id, 'For Rating', 'Rated', `Final Rating: ${finalAverage} (${adjectivalRating})`);

    // Notify the employee that their IPCR has been rated
    try {
      await createNotification({
        recipientId: ipcr.employee_id,
        senderId: user.id,
        title: 'IPCR Rated',
        message: `Your performance has been rated: ${finalAverage} (${adjectivalRating}). Please review and acknowledge.`,
        type: 'ipcr_rated',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'IPCR rated successfully',
      finalRating: parseFloat(finalAverage),
      adjectivalRating 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Rate IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to rate IPCR' });
  } finally {
    connection.release();
  }
};

// Employee acknowledges the rating
export const acknowledgeIPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_remarks, agree } = req.body;
    const user = req.user;

    const [ipcrs] = await db.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    if (ipcr.employee_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Only the employee can acknowledge their IPCR' });
    }

    if (ipcr.status !== 'Rated') {
      return res.status(400).json({ success: false, message: 'IPCR must be in Rated status to acknowledge' });
    }

    await db.query(
      `UPDATE spms_ipcr SET 
        status = 'Acknowledged', 
        date_acknowledged = CURDATE(),
        employee_remarks = ?
       WHERE id = ?`,
      [employee_remarks, id]
    );

    const agreementText = agree ? 'Employee agreed with rating' : 'Employee disagreed with rating';
    await logIPCRActivity(id, 'Acknowledged', user.id, 'Rated', 'Acknowledged', agreementText);

    // Notify the approver that IPCR is ready for approval
    try {
      if (ipcr.approver_id) {
        await createNotification({
          recipientId: ipcr.approver_id,
          senderId: user.id,
          title: 'IPCR Ready for Approval',
          message: `An IPCR has been acknowledged and is ready for your approval.`,
          type: 'ipcr_acknowledged',
          referenceId: id
        });
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'IPCR acknowledged successfully' });
  } catch (error) {
    console.error('Acknowledge IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to acknowledge IPCR' });
  }
};

// Head of Office approves the IPCR
export const approveIPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_remarks } = req.body;
    const user = req.user;

    const [ipcrs] = await db.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    // Only admin/hr or assigned approver can approve
    if (user.role !== 'admin' && user.role !== 'hr' && ipcr.approver_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to approve this IPCR' });
    }

    if (ipcr.status !== 'Acknowledged') {
      return res.status(400).json({ success: false, message: 'IPCR must be acknowledged before approval' });
    }

    await db.query(
      `UPDATE spms_ipcr SET 
        status = 'Approved', 
        date_approved = CURDATE(),
        approver_id = ?,
        approver_remarks = ?
       WHERE id = ?`,
      [user.id, approver_remarks, id]
    );

    await logIPCRActivity(id, 'Approved', user.id, 'Acknowledged', 'Approved', 'IPCR approved by Head of Office');

    // Notify the employee that their IPCR has been approved
    try {
      await createNotification({
        recipientId: ipcr.employee_id,
        senderId: user.id,
        title: 'IPCR Approved',
        message: `Your performance review has been approved. Final Rating: ${ipcr.final_average_rating} (${ipcr.adjectival_rating}).`,
        type: 'ipcr_approved',
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    res.json({ success: true, message: 'IPCR approved successfully' });
  } catch (error) {
    console.error('Approve IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve IPCR' });
  }
};

// Finalize IPCR
export const finalizeIPCR = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Only admin can finalize IPCRs' });
    }

    const [ipcrs] = await db.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    if (ipcrs[0].status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'IPCR must be approved before finalizing' });
    }

    await db.query("UPDATE spms_ipcr SET status = 'Final' WHERE id = ?", [id]);

    await logIPCRActivity(id, 'Finalized', user.id, 'Approved', 'Final', 'IPCR finalized');

    res.json({ success: true, message: 'IPCR finalized successfully' });
  } catch (error) {
    console.error('Finalize IPCR Error:', error);
    res.status(500).json({ success: false, message: 'Failed to finalize IPCR' });
  }
};

// =====================================================
// COMPETENCY RATING
// =====================================================

export const updateCompetencyRatings = async (req, res) => {
  try {
    const { id } = req.params; // IPCR ID
    const { competencies, isEmployeeSelfRating } = req.body;
    const user = req.user;

    for (const comp of competencies) {
      if (isEmployeeSelfRating) {
        await db.query(
          'UPDATE spms_ipcr_competencies SET self_rating = ?, remarks = ? WHERE id = ?',
          [comp.rating, comp.remarks, comp.id]
        );
      } else {
        await db.query(
          'UPDATE spms_ipcr_competencies SET supervisor_rating = ?, remarks = ? WHERE id = ?',
          [comp.rating, comp.remarks, comp.id]
        );
      }
    }

    res.json({ success: true, message: 'Competency ratings updated successfully' });
  } catch (error) {
    console.error('Update Competency Ratings Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update competency ratings' });
  }
};

// =====================================================
// DASHBOARD & REPORTS
// =====================================================

export const getSPMSDashboard = async (req, res) => {
  try {
    const user = req.user;

    // Get active cycle
    const [activeCycles] = await db.query(
      "SELECT * FROM spms_cycles WHERE status = 'Active' ORDER BY start_date DESC LIMIT 1"
    );
    const activeCycle = activeCycles[0] || null;

    // Get statistics
    const [totalEmployees] = await db.query(
      "SELECT COUNT(*) as count FROM authentication WHERE role != 'admin'"
    );

    let ipcrStats = { draft: 0, committed: 0, forRating: 0, rated: 0, acknowledged: 0, approved: 0, final: 0 };
    
    if (activeCycle) {
      const [stats] = await db.query(`
        SELECT status, COUNT(*) as count 
        FROM spms_ipcr 
        WHERE cycle_id = ?
        GROUP BY status
      `, [activeCycle.id]);

      stats.forEach(s => {
        const key = s.status.replace(' ', '').toLowerCase();
        if (key === 'forrating') ipcrStats.forRating = s.count;
        else ipcrStats[key] = s.count;
      });
    }

    // Get pending actions for current user
    let pendingActions = [];
    
    if (user.role === 'admin' || user.role === 'hr') {
      // Pending approvals
      const [pendingApprovals] = await db.query(`
        SELECT i.id, e.first_name, e.last_name, i.final_average_rating
        FROM spms_ipcr i
        JOIN authentication e ON i.employee_id = e.id
        WHERE i.status = 'Acknowledged'
        LIMIT 5
      `);
      pendingActions = pendingApprovals.map(p => ({
        type: 'approval',
        message: `${p.first_name} ${p.last_name}'s IPCR awaiting approval`,
        ipcrId: p.id
      }));
    }

    // Get rating distribution for charts
    const [ratingDistribution] = await db.query(`
      SELECT adjectival_rating, COUNT(*) as count
      FROM spms_ipcr
      WHERE adjectival_rating IS NOT NULL
      GROUP BY adjectival_rating
    `);

    res.json({
      success: true,
      activeCycle,
      stats: {
        totalEmployees: totalEmployees[0].count,
        ...ipcrStats
      },
      pendingActions,
      ratingDistribution
    });
  } catch (error) {
    console.error('Get SPMS Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

export const getDepartmentReport = async (req, res) => {
  try {
    const { department, cycle_id } = req.query;

    let query = `
      SELECT 
        e.department,
        COUNT(DISTINCT i.id) as total_ipcrs,
        AVG(i.final_average_rating) as avg_rating,
        SUM(CASE WHEN i.adjectival_rating = 'Outstanding' THEN 1 ELSE 0 END) as outstanding,
        SUM(CASE WHEN i.adjectival_rating = 'Very Satisfactory' THEN 1 ELSE 0 END) as very_satisfactory,
        SUM(CASE WHEN i.adjectival_rating = 'Satisfactory' THEN 1 ELSE 0 END) as satisfactory,
        SUM(CASE WHEN i.adjectival_rating = 'Unsatisfactory' THEN 1 ELSE 0 END) as unsatisfactory,
        SUM(CASE WHEN i.adjectival_rating = 'Poor' THEN 1 ELSE 0 END) as poor
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      WHERE i.status IN ('Approved', 'Final')
    `;
    const params = [];

    if (department) {
      query += ' AND e.department = ?';
      params.push(department);
    }

    if (cycle_id) {
      query += ' AND i.cycle_id = ?';
      params.push(cycle_id);
    }

    query += ' GROUP BY e.department ORDER BY e.department';

    const [report] = await db.query(query, params);

    res.json({ success: true, report });
  } catch (error) {
    console.error('Get Department Report Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

// =====================================================
// MID-YEAR REVIEW
// =====================================================

// Get mid-year review data for an IPCR
export const getMidYearReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [ipcrs] = await db.query(`
      SELECT 
        i.id,
        i.employee_id,
        i.mid_year_review_date,
        i.mid_year_rating,
        i.mid_year_adjectival_rating,
        i.mid_year_accomplishments,
        i.mid_year_challenges,
        i.mid_year_recommendations,
        i.mid_year_reviewed_by,
        i.mid_year_employee_remarks,
        i.mid_year_supervisor_remarks,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        reviewer.first_name as reviewer_first_name,
        reviewer.last_name as reviewer_last_name,
        c.title as cycle_title,
        c.year as cycle_year
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      LEFT JOIN authentication reviewer ON i.mid_year_reviewed_by = reviewer.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    // Security check
    if (user.role !== 'admin' && user.role !== 'hr') {
      if (ipcr.employee_id !== user.id && ipcr.mid_year_reviewed_by !== user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
    }

    res.json({ success: true, midYearReview: ipcr });
  } catch (error) {
    console.error('Get Mid-Year Review Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mid-year review' });
  }
};

// Submit mid-year review
export const submitMidYearReview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mid_year_rating,
      mid_year_accomplishments,
      mid_year_challenges,
      mid_year_recommendations,
      mid_year_employee_remarks,
      mid_year_supervisor_remarks
    } = req.body;
    const user = req.user;

    const [ipcrs] = await db.query('SELECT * FROM spms_ipcr WHERE id = ?', [id]);
    if (ipcrs.length === 0) {
      return res.status(404).json({ success: false, message: 'IPCR not found' });
    }

    const ipcr = ipcrs[0];

    // Calculate adjectival rating
    let midYearAdjectival = null;
    if (mid_year_rating) {
      midYearAdjectival = getAdjectivalRating(parseFloat(mid_year_rating));
    }

    await db.query(
      `UPDATE spms_ipcr SET
        mid_year_review_date = CURDATE(),
        mid_year_rating = ?,
        mid_year_adjectival_rating = ?,
        mid_year_accomplishments = ?,
        mid_year_challenges = ?,
        mid_year_recommendations = ?,
        mid_year_reviewed_by = ?,
        mid_year_employee_remarks = COALESCE(?, mid_year_employee_remarks),
        mid_year_supervisor_remarks = COALESCE(?, mid_year_supervisor_remarks)
       WHERE id = ?`,
      [
        mid_year_rating || null,
        midYearAdjectival,
        mid_year_accomplishments || null,
        mid_year_challenges || null,
        mid_year_recommendations || null,
        user.id,
        mid_year_employee_remarks,
        mid_year_supervisor_remarks,
        id
      ]
    );

    await logIPCRActivity(id, 'Mid-Year Review Submitted', user.id, null, null, 
      `Mid-Year Rating: ${mid_year_rating || 'N/A'} (${midYearAdjectival || 'N/A'})`);

    res.json({ success: true, message: 'Mid-year review submitted successfully' });
  } catch (error) {
    console.error('Submit Mid-Year Review Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit mid-year review' });
  }
};

// =====================================================
// MFO BUDGET MANAGEMENT
// =====================================================

// Update MFO budget allocation
export const updateMFOBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { allotted_budget, actual_expenditure, budget_source, fiscal_year, budget_remarks } = req.body;
    const user = req.user;

    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Only admin can update budget' });
    }

    await db.query(
      `UPDATE spms_mfo SET
        allotted_budget = COALESCE(?, allotted_budget),
        actual_expenditure = COALESCE(?, actual_expenditure),
        budget_source = COALESCE(?, budget_source),
        fiscal_year = COALESCE(?, fiscal_year),
        budget_remarks = COALESCE(?, budget_remarks)
       WHERE id = ?`,
      [allotted_budget, actual_expenditure, budget_source, fiscal_year, budget_remarks, id]
    );

    res.json({ success: true, message: 'MFO budget updated successfully' });
  } catch (error) {
    console.error('Update MFO Budget Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update MFO budget' });
  }
};

// =====================================================
// AUTO-CREATE PDP FOR POOR PERFORMERS
// =====================================================

// Helper function to auto-create development plan for poor rated employees
export const autoCreateDevelopmentPlan = async (ipcrId, userId) => {
  try {
    const [ipcrs] = await db.query(`
      SELECT i.*, e.first_name, e.last_name 
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      WHERE i.id = ?
    `, [ipcrId]);

    if (ipcrs.length === 0) return null;
    
    const ipcr = ipcrs[0];

    // Only create for Unsatisfactory or Poor ratings
    if (!['Unsatisfactory', 'Poor'].includes(ipcr.adjectival_rating)) {
      return null;
    }

    // Check if PDP already exists for this IPCR
    const [existing] = await db.query(
      'SELECT id FROM spms_development_plans WHERE ipcr_id = ?',
      [ipcrId]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Calculate dates
    const startDate = new Date();
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 6); // 6-month development period

    // Create the development plan
    const [result] = await db.query(
      `INSERT INTO spms_development_plans 
       (employee_id, ipcr_id, cycle_id, competency_gap, current_proficiency_level,
        target_proficiency_level, development_objective, start_date, target_completion_date,
        status, created_by)
       VALUES (?, ?, ?, ?, 'Beginner', 'Proficient', ?, ?, ?, 'Draft', ?)`,
      [
        ipcr.employee_id,
        ipcrId,
        ipcr.cycle_id,
        `Performance improvement needed - ${ipcr.adjectival_rating} rating in IPCR`,
        `Improve overall performance to achieve at least Satisfactory rating in the next evaluation period`,
        startDate.toISOString().split('T')[0],
        targetDate.toISOString().split('T')[0],
        userId
      ]
    );

    console.log(`✅ Auto-created PDP #${result.insertId} for ${ipcr.first_name} ${ipcr.last_name} (${ipcr.adjectival_rating} rating)`);

    return result.insertId;
  } catch (error) {
    console.error('Auto-create Development Plan Error:', error);
    return null;
  }
};

// Get employees needing development plans
export const getEmployeesNeedingPDP = async (req, res) => {
  try {
    const { cycle_id } = req.query;

    let query = `
      SELECT 
        i.id as ipcr_id,
        i.employee_id,
        i.final_average_rating,
        i.adjectival_rating,
        e.first_name,
        e.last_name,
        e.department,
        e.job_title,
        c.title as cycle_title,
        d.id as pdp_id,
        d.status as pdp_status
      FROM spms_ipcr i
      JOIN authentication e ON i.employee_id = e.id
      JOIN spms_cycles c ON i.cycle_id = c.id
      LEFT JOIN spms_development_plans d ON d.ipcr_id = i.id
      WHERE i.adjectival_rating IN ('Unsatisfactory', 'Poor')
    `;
    const params = [];

    if (cycle_id) {
      query += ' AND i.cycle_id = ?';
      params.push(cycle_id);
    }

    query += ' ORDER BY i.final_average_rating ASC, e.last_name ASC';

    const [employees] = await db.query(query, params);

    res.json({ success: true, employees });
  } catch (error) {
    console.error('Get Employees Needing PDP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};
