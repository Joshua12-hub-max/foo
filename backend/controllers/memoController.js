import db from '../db/connection.js';

/**
 * Generate next memo number (MEMO-YYYY-XXXX format)
 */
const generateMemoNumber = async () => {
  const year = new Date().getFullYear();
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Get or create sequence for current year
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
 * Get all memos with filters
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
    
    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;
    
    // Add pagination
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
 * Create new memo
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
    
    const [result] = await db.query(`
      INSERT INTO employee_memos 
        (memo_number, employee_id, author_id, memo_type, subject, content, priority, effective_date, acknowledgment_required, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [memo_number, employee_id, author_id, memo_type, subject, content, priority, effective_date || null, acknowledgment_required, status]);
    
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
 * Update memo
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
    
    res.json({ success: true, message: 'Memo updated successfully' });
  } catch (error) {
    console.error('Error updating memo:', error);
    res.status(500).json({ success: false, message: 'Failed to update memo' });
  }
};

/**
 * Delete memo
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
 * Acknowledge memo (by employee)
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
    
    await db.query(`
      UPDATE employee_memos SET 
        acknowledged_at = NOW(),
        status = 'Acknowledged'
      WHERE id = ?
    `, [id]);
    
    res.json({ success: true, message: 'Memo acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging memo:', error);
    res.status(500).json({ success: false, message: 'Failed to acknowledge memo' });
  }
};