import { Request, Response } from 'express';
import db from '../db/connection.js';
import { createNotification } from './notificationController.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface MemoRow extends RowDataPacket {
  id: number; employee_id: number; author_id: number; memo_number: string; memo_type: string;
  subject: string; content: string; status: string; priority: string; effective_date?: string;
  acknowledgment_required: boolean; acknowledged_at?: string; employee_name?: string; author_name?: string;
}
interface EmployeeRow extends RowDataPacket { employee_id: string; first_name: string; last_name: string; item_number?: string; }
interface CountRow extends RowDataPacket { total: number; }
interface SequenceRow extends RowDataPacket { last_number: number; }

const MEMO_TYPE_TO_STATUS: Record<string, string> = {
  'Termination Notice': 'Terminated', 'Terminated': 'Terminated', 'Suspension Notice': 'Suspended',
  'Suspended': 'Suspended', 'Verbal Warning': 'Verbal Warning', 'Written Warning': 'Written Warning', 'Show Cause': 'Show Cause'
};

const generateMemoNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const conn = await db.getConnection() as PoolConnection;
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query<SequenceRow[]>('SELECT last_number FROM memo_sequences WHERE year = ? FOR UPDATE', [year]);
    let nextNumber: number;
    if (existing.length === 0) { await conn.query('INSERT INTO memo_sequences (year, last_number) VALUES (?, 1)', [year]); nextNumber = 1; }
    else { nextNumber = existing[0].last_number + 1; await conn.query('UPDATE memo_sequences SET last_number = ? WHERE year = ?', [nextNumber, year]); }
    await conn.commit();
    return `MEMO-${year}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
};

const getStatusFromMemoType = (memoType: string): string | null => MEMO_TYPE_TO_STATUS[memoType] || null;

const updateEmployeeStatus = async (employeeId: number, newStatus: string): Promise<void> => {
  await db.query('UPDATE authentication SET employment_status = ? WHERE id = ?', [newStatus, employeeId]);
  if (newStatus === 'Terminated') {
    const [emp] = await db.query<EmployeeRow[]>('SELECT item_number FROM authentication WHERE id = ?', [employeeId]);
    if (emp.length > 0 && emp[0].item_number && emp[0].item_number !== 'N/A') {
      await db.query('UPDATE plantilla_positions SET is_vacant = TRUE WHERE item_number = ?', [emp[0].item_number]);
    }
  }
};

const notifyEmployeeOfMemo = async (employeeId: number, authorId: number, memoType: string, subject: string, memoId: number): Promise<void> => {
  try {
    const [empData] = await db.query<EmployeeRow[]>('SELECT employee_id FROM authentication WHERE id = ?', [employeeId]);
    const [authorData] = await db.query<EmployeeRow[]>('SELECT employee_id FROM authentication WHERE id = ?', [authorId]);
    if (empData.length > 0 && authorData.length > 0) {
      await createNotification({ recipientId: empData[0].employee_id, senderId: authorData[0].employee_id, title: `New ${memoType}`, message: `You have received a ${memoType}: ${subject}`, type: 'memo_received', referenceId: memoId });
    }
  } catch (error) { console.error('Notification error:', error); }
};

const notifyAuthorOfAcknowledgment = async (employeeId: number, authorId: number, memo: MemoRow, memoId: number): Promise<void> => {
  try {
    const [empData] = await db.query<EmployeeRow[]>('SELECT employee_id, first_name, last_name FROM authentication WHERE id = ?', [employeeId]);
    const [authorData] = await db.query<EmployeeRow[]>('SELECT employee_id FROM authentication WHERE id = ?', [authorId]);
    if (empData.length > 0 && authorData.length > 0) {
      const empName = `${empData[0].first_name} ${empData[0].last_name}`;
      await createNotification({ recipientId: authorData[0].employee_id, senderId: empData[0].employee_id, title: 'Memo Acknowledged', message: `${empName} has acknowledged the ${memo.memo_type}: ${memo.subject}`, type: 'memo_acknowledged', referenceId: memoId });
    }
  } catch (error) { console.error('Notification error:', error); }
};

export const getAllMemos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memo_type, status, employee_id, search, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query = `SELECT m.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, e.employee_id as employee_number, CONCAT(a.first_name, ' ', a.last_name) as author_name FROM employee_memos m JOIN authentication e ON m.employee_id = e.id JOIN authentication a ON m.author_id = a.id WHERE 1=1`;
    const params: (string | number)[] = [];
    if (memo_type) { query += ' AND m.memo_type = ?'; params.push(memo_type as string); }
    if (status) { query += ' AND m.status = ?'; params.push(status as string); }
    if (employee_id) { query += ' AND m.employee_id = ?'; params.push(employee_id as string); }
    if (search) { query += ' AND (m.subject LIKE ? OR m.memo_number LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query<CountRow[]>(countQuery, params);
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?'; params.push(parseInt(limit as string), offset);
    const [memos] = await db.query<MemoRow[]>(query, params);
    res.json({ success: true, memos, pagination: { total: countResult[0].total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(countResult[0].total / parseInt(limit as string)) } });
  } catch (error) { console.error('Error fetching memos:', error); res.status(500).json({ success: false, message: 'Failed to fetch memos' }); }
};

export const getMyMemos = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; const employee_id = authReq.user.id;
    const [memos] = await db.query<MemoRow[]>(`SELECT m.*, CONCAT(a.first_name, ' ', a.last_name) as author_name FROM employee_memos m JOIN authentication a ON m.author_id = a.id WHERE m.employee_id = ? AND m.status IN ('Sent', 'Acknowledged') ORDER BY m.created_at DESC`, [employee_id]);
    res.json({ success: true, memos });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch memos' }); }
};

export const getMemoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [memos] = await db.query<MemoRow[]>(`SELECT m.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, e.employee_id as employee_number, e.email as employee_email, e.department, CONCAT(a.first_name, ' ', a.last_name) as author_name FROM employee_memos m JOIN authentication e ON m.employee_id = e.id JOIN authentication a ON m.author_id = a.id WHERE m.id = ?`, [id]);
    if (memos.length === 0) { res.status(404).json({ success: false, message: 'Memo not found' }); return; }
    res.json({ success: true, memo: memos[0] });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch memo' }); }
};

export const createMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employee_id, memo_type, subject, content, priority = 'Normal', effective_date, acknowledgment_required = false, status = 'Draft' } = req.body;
    const author_id = authReq.user.id; const memo_number = await generateMemoNumber();
    const [result] = await db.query<ResultSetHeader>(`INSERT INTO employee_memos (memo_number, employee_id, author_id, memo_type, subject, content, priority, effective_date, acknowledgment_required, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [memo_number, employee_id, author_id, memo_type, subject, content, priority, effective_date || null, acknowledgment_required, status]);
    if (status === 'Sent') { const newStatus = getStatusFromMemoType(memo_type); if (newStatus) await updateEmployeeStatus(employee_id, newStatus); await notifyEmployeeOfMemo(employee_id, author_id, memo_type, subject, result.insertId); }
    res.status(201).json({ success: true, message: 'Memo created successfully', memo: { id: result.insertId, memo_number } });
  } catch (error) { console.error('Error creating memo:', error); res.status(500).json({ success: false, message: 'Failed to create memo' }); }
};

export const updateMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { employee_id, memo_type, subject, content, priority, effective_date, acknowledgment_required, status } = req.body;
    const [result] = await db.query<ResultSetHeader>(`UPDATE employee_memos SET employee_id = COALESCE(?, employee_id), memo_type = COALESCE(?, memo_type), subject = COALESCE(?, subject), content = COALESCE(?, content), priority = COALESCE(?, priority), effective_date = COALESCE(?, effective_date), acknowledgment_required = COALESCE(?, acknowledgment_required), status = COALESCE(?, status) WHERE id = ?`, [employee_id, memo_type, subject, content, priority, effective_date, acknowledgment_required, status, id]);
    if (result.affectedRows === 0) { res.status(404).json({ success: false, message: 'Memo not found' }); return; }
    if (status === 'Sent') { const [updatedMemo] = await db.query<MemoRow[]>('SELECT * FROM employee_memos WHERE id = ?', [id]); if (updatedMemo.length > 0) { const newStatus = getStatusFromMemoType(updatedMemo[0].memo_type); if (newStatus) await updateEmployeeStatus(updatedMemo[0].employee_id, newStatus); await notifyEmployeeOfMemo(updatedMemo[0].employee_id, updatedMemo[0].author_id, updatedMemo[0].memo_type, updatedMemo[0].subject, parseInt(id)); } }
    res.json({ success: true, message: 'Memo updated successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update memo' }); }
};

export const deleteMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [result] = await db.query<ResultSetHeader>('DELETE FROM employee_memos WHERE id = ?', [id]);
    if (result.affectedRows === 0) { res.status(404).json({ success: false, message: 'Memo not found' }); return; }
    res.json({ success: true, message: 'Memo deleted successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete memo' }); }
};

export const acknowledgeMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; const authReq = req as AuthenticatedRequest; const employee_id = authReq.user.id;
    const [memo] = await db.query<MemoRow[]>('SELECT * FROM employee_memos WHERE id = ? AND employee_id = ?', [id, employee_id]);
    if (memo.length === 0) { res.status(404).json({ success: false, message: 'Memo not found' }); return; }
    if (memo[0].acknowledged_at) { res.status(400).json({ success: false, message: 'Memo already acknowledged' }); return; }
    await db.query(`UPDATE employee_memos SET acknowledged_at = NOW(), status = 'Acknowledged' WHERE id = ?`, [id]);
    await notifyAuthorOfAcknowledgment(employee_id, memo[0].author_id, memo[0], parseInt(id));
    res.json({ success: true, message: 'Memo acknowledged successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to acknowledge memo' }); }
};
