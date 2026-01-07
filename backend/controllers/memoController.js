import db from '../db/connection.js';
import { createNotification } from './notificationController.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Mapping of memo types to employment statuses
 * When a memo is sent, the employee's status is automatically updated
 */
const MEMO_TYPE_TO_STATUS = {
  'Termination Notice': 'Terminated',
  'Terminated': 'Terminated',
  'Suspension Notice': 'Suspended',
  'Suspended': 'Suspended',
  'Verbal Warning': 'Verbal Warning',
  'Written Warning': 'Written Warning',
  'Show Cause': 'Show Cause'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate next memo number (MEMO-YYYY-XXXX format)
 * Uses database transaction to ensure unique sequential numbers
 */
const generateMemoNumber = async () => {
  const year = new Date().getFullYear();
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const [existing] = await conn.query(
      'SELECT last_number FROM memo_sequences WHERE year = ? FOR UPDATE',
      [year]
    );
    
    let nextNumber;
    if (existing.length === 0) {
      await conn.query(
        'INSERT INTO memo_sequences (year, last_number) VALUES (?, 1)',
        [year]
      );
      nextNumber = 1;
    } else {
      nextNumber = existing[0].last_number + 1;
      await conn.query(
        'UPDATE memo_sequences SET last_number = ? WHERE year = ?',
        [nextNumber, year]
      );
    }
    
    await conn.commit();
    return `MEMO-${year}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Get employee's employment status based on memo type
 * @param {string} memoType - The type of memo
 * @returns {string|null} - The corresponding employment status or null
 */
const getStatusFromMemoType = (memoType) => {
  return MEMO_TYPE_TO_STATUS[memoType] || null;
};

/**
 * Update employee status and handle side effects (e.g., free up plantilla for termination)
 * @param {number} employeeId - The employee's database ID
 * @param {string} newStatus - The new employment status
 */
const updateEmployeeStatus = async (employeeId, newStatus) => {
  try {
    // Update employee status
    await db.query(
      "UPDATE authentication SET employment_status = ? WHERE id = ?",
      [newStatus, employeeId]
    );
    
    // Special handling for Termination: Free up plantilla position
    if (newStatus === 'Terminated') {
      const [emp] = await db.query(
        "SELECT item_number FROM authentication WHERE id = ?",
        [employeeId]
      );
      
      if (emp.length > 0 && emp[0].item_number && emp[0].item_number !== 'N/A') {
        await db.query(
          "UPDATE plantilla_positions SET is_vacant = TRUE WHERE item_number = ?",
          [emp[0].item_number]
        );
      }
    }
  } catch (error) {
    console.error('Error updating employee status:', error);
    throw error;
  }
};

/**
 * Send notification to employee when a memo is sent to them
 * @param {number} employeeId - Target employee's database ID
 * @param {number} authorId - Memo author's database ID
 * @param {string} memoType - Type of memo
 * @param {string} subject - Memo subject
 * @param {number} memoId - The memo's database ID
 */
const notifyEmployeeOfMemo = async (employeeId, authorId, memoType, subject, memoId) => {
  try {
    const [empData] = await db.query(
      "SELECT employee_id FROM authentication WHERE id = ?",
      [employeeId]
    );
    const [authorData] = await db.query(
      "SELECT employee_id FROM authentication WHERE id = ?",
      [authorId]
    );
    
    if (empData.length > 0 && authorData.length > 0) {
      await createNotification({
        recipientId: empData[0].employee_id,
        senderId: authorData[0].employee_id,
        title: `New ${memoType}`,
        message: `You have received a ${memoType}: ${subject}`,
        type: 'memo_received',
        referenceId: memoId
      });
    }
  } catch (error) {
    console.error('Notification error:', error.message);
    // Don't throw - notification failure shouldn't break the main operation
  }
};

/**
 * Send notification to author when employee acknowledges a memo
 * @param {number} employeeId - Employee's database ID
 * @param {number} authorId - Memo author's database ID
 * @param {object} memo - The memo object with memo_type and subject
 * @param {number} memoId - The memo's database ID
 */
const notifyAuthorOfAcknowledgment = async (employeeId, authorId, memo, memoId) => {
  try {
    const [empData] = await db.query(
      "SELECT employee_id, first_name, last_name FROM authentication WHERE id = ?",
      [employeeId]
    );
    const [authorData] = await db.query(
      "SELECT employee_id FROM authentication WHERE id = ?",
      [authorId]
    );
    
    if (empData.length > 0 && authorData.length > 0) {
      const empName = `${empData[0].first_name} ${empData[0].last_name}`;
      await createNotification({
        recipientId: authorData[0].employee_id,
        senderId: empData[0].employee_id,
        title: 'Memo Acknowledged',
        message: `${empName} has acknowledged the ${memo.memo_type}: ${memo.subject}`,
        type: 'memo_acknowledged',
        referenceId: memoId
      });
    }
  } catch (error) {
    console.error('Notification error:', error.message);
    // Don't throw - notification failure shouldn't break the main operation
  }
};

// ============================================================================
// API CONTROLLERS
// ============================================================================

/**
 * Get all memos with filters (Admin)
 * Supports filtering by memo_type, status, employee_id, search, and pagination
 */
export const getAllMemos = async (req, res) => {
  try {
    const { memo_type, status, employee_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.employee_id as employee_number,
        CONCAT(a.first_name, ' ', a.last_name) as author_name
      FROM employee_memos m
      JOIN authentication e ON m.employee_id = e.id
      JOIN authentication a ON m.author_id = a.id
      WHERE 1=1
    `;
    const params = [];
    
    // Apply filters
    if (memo_type) {
      query += ' AND m.memo_type = ?';
      params.push(memo_type);
    }
    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }
    if (employee_id) {
      query += ' AND m.employee_id = ?';
      params.push(employee_id);
    }
    if (search) {
      query += ' AND (m.subject LIKE ? OR m.memo_number LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count for pagination
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;
    
    // Add sorting and pagination
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [memos] = await db.query(query, params);
    
    res.json({
      success: true,
      memos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching memos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch memos' });
  }
};

/**
 * Get memos for the logged-in employee
 * Only returns memos with status 'Sent' or 'Acknowledged'
 */
export const getMyMemos = async (req, res) => {
  try {
    const employee_id = req.user.id;
    
    const [memos] = await db.query(`
      SELECT 
        m.*,
        CONCAT(a.first_name, ' ', a.last_name) as author_name
      FROM employee_memos m
      JOIN authentication a ON m.author_id = a.id
      WHERE m.employee_id = ? AND m.status IN ('Sent', 'Acknowledged')
      ORDER BY m.created_at DESC
    `, [employee_id]);
    
    res.json({ success: true, memos });
  } catch (error) {
    console.error('Error fetching my memos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch memos' });
  }
};

/**
 * Get single memo by ID
 */
export const getMemoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [memos] = await db.query(`
      SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.employee_id as employee_number,
        e.email as employee_email,
        e.department,
        CONCAT(a.first_name, ' ', a.last_name) as author_name
      FROM employee_memos m
      JOIN authentication e ON m.employee_id = e.id
      JOIN authentication a ON m.author_id = a.id
      WHERE m.id = ?
    `, [id]);
    
    if (memos.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    
    res.json({ success: true, memo: memos[0] });
  } catch (error) {
    console.error('Error fetching memo:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch memo' });
  }
};

/**
 * Create new memo (Admin)
 * - If status is 'Sent', automatically updates employee's employment status
 * - Sends notification to the employee
 */
export const createMemo = async (req, res) => {
  try {
    const {
      employee_id,
      memo_type,
      subject,
      content,
      priority = 'Normal',
      effective_date,
      acknowledgment_required = false,
      status = 'Draft'
    } = req.body;
    
    const author_id = req.user.id;
    const memo_number = await generateMemoNumber();
    
    // Insert memo into database
    const [result] = await db.query(`
      INSERT INTO employee_memos 
        (memo_number, employee_id, author_id, memo_type, subject, content, priority, effective_date, acknowledgment_required, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [memo_number, employee_id, author_id, memo_type, subject, content, priority, effective_date || null, acknowledgment_required, status]);

    // If memo is sent immediately, apply automation
    if (status === 'Sent') {
      // Update employee status based on memo type
      const newStatus = getStatusFromMemoType(memo_type);
      if (newStatus) {
        await updateEmployeeStatus(employee_id, newStatus);
      }
      
      // Send notification to employee
      await notifyEmployeeOfMemo(employee_id, author_id, memo_type, subject, result.insertId);
    }
    
    res.status(201).json({
      success: true,
      message: 'Memo created successfully',
      memo: { id: result.insertId, memo_number }
    });
  } catch (error) {
    console.error('Error creating memo:', error);
    res.status(500).json({ success: false, message: 'Failed to create memo' });
  }
};

/**
 * Update memo (Admin)
 * - If status is changed to 'Sent', applies automation
 */
export const updateMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      memo_type,
      subject,
      content,
      priority,
      effective_date,
      acknowledgment_required,
      status
    } = req.body;
    
    const [result] = await db.query(`
      UPDATE employee_memos SET
        employee_id = COALESCE(?, employee_id),
        memo_type = COALESCE(?, memo_type),
        subject = COALESCE(?, subject),
        content = COALESCE(?, content),
        priority = COALESCE(?, priority),
        effective_date = COALESCE(?, effective_date),
        acknowledgment_required = COALESCE(?, acknowledgment_required),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [employee_id, memo_type, subject, content, priority, effective_date, acknowledgment_required, status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    // If status changed to 'Sent', apply automation
    if (status === 'Sent') {
      const [updatedMemo] = await db.query("SELECT * FROM employee_memos WHERE id = ?", [id]);
      
      if (updatedMemo.length > 0) {
        const newStatus = getStatusFromMemoType(updatedMemo[0].memo_type);
        if (newStatus) {
          await updateEmployeeStatus(updatedMemo[0].employee_id, newStatus);
        }
        
        // Send notification to employee
        await notifyEmployeeOfMemo(
          updatedMemo[0].employee_id,
          updatedMemo[0].author_id,
          updatedMemo[0].memo_type,
          updatedMemo[0].subject,
          parseInt(id)
        );
      }
    }
    
    res.json({ success: true, message: 'Memo updated successfully' });
  } catch (error) {
    console.error('Error updating memo:', error);
    res.status(500).json({ success: false, message: 'Failed to update memo' });
  }
};

/**
 * Delete memo (Admin)
 */
export const deleteMemo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM employee_memos WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    
    res.json({ success: true, message: 'Memo deleted successfully' });
  } catch (error) {
    console.error('Error deleting memo:', error);
    res.status(500).json({ success: false, message: 'Failed to delete memo' });
  }
};

/**
 * Acknowledge memo (Employee)
 * - Marks memo as acknowledged
 * - Sends notification to the memo author
 */
export const acknowledgeMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.user.id;
    
    // Verify the memo belongs to this employee
    const [memo] = await db.query(
      'SELECT * FROM employee_memos WHERE id = ? AND employee_id = ?',
      [id, employee_id]
    );
    
    if (memo.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    
    if (memo[0].acknowledged_at) {
      return res.status(400).json({ success: false, message: 'Memo already acknowledged' });
    }
    
    // Update memo status
    await db.query(`
      UPDATE employee_memos SET 
        acknowledged_at = NOW(),
        status = 'Acknowledged'
      WHERE id = ?
    `, [id]);
    
    // Notify the memo author
    await notifyAuthorOfAcknowledgment(employee_id, memo[0].author_id, memo[0], parseInt(id));
    
    res.json({ success: true, message: 'Memo acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging memo:', error);
    res.status(500).json({ success: false, message: 'Failed to acknowledge memo' });
  }
};