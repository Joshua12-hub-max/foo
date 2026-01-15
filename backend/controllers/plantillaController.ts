import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface PositionRow extends RowDataPacket {
  id: number; item_number: string; position_title: string; salary_grade: number; step_increment: number;
  department?: string; is_vacant: boolean; incumbent_id?: number; monthly_salary?: number;
  incumbent_first_name?: string; incumbent_last_name?: string; filled_date?: string; vacated_date?: string;
}
interface EmployeeRow extends RowDataPacket { id: number; first_name: string; last_name: string; employee_id: string; department?: string; item_number?: string; }
interface SummaryRow extends RowDataPacket { total: number; vacant: number; filled: number; total_monthly_salary: number; }
interface HistoryRow extends RowDataPacket { position_id: number; employee_id: number; employee_name: string; position_title: string; start_date: string; end_date?: string; reason?: string; }
interface AuditRow extends RowDataPacket { position_id: number; action: string; actor_id: number; actor_first_name?: string; actor_last_name?: string; old_values?: string; new_values?: string; item_number?: string; position_title?: string; created_at: Date; }
interface SalaryRow extends RowDataPacket { salary_grade: number; step: number; monthly_salary: number; }

const logAudit = async (positionId: number, action: string, actorId: number, oldValues: object | null = null, newValues: object | null = null): Promise<void> => {
  try { await db.query(`INSERT INTO plantilla_audit_log (position_id, action, actor_id, old_values, new_values) VALUES (?, ?, ?, ?, ?)`, [positionId, action, actorId, JSON.stringify(oldValues), JSON.stringify(newValues)]); }
  catch (error) { console.error('Audit log error:', error); }
};

export const getPlantilla = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, is_vacant } = req.query;
    let query = `SELECT p.*, a.first_name as incumbent_first_name, a.last_name as incumbent_last_name, a.employee_id as incumbent_employee_id FROM plantilla_positions p LEFT JOIN authentication a ON p.incumbent_id = a.id WHERE 1=1`;
    const params: (string | number)[] = [];
    if (department && department !== 'All') { query += ' AND p.department = ?'; params.push(department as string); }
    if (is_vacant !== undefined) { query += ' AND p.is_vacant = ?'; params.push(is_vacant === 'true' || is_vacant === '1' ? 1 : 0); }
    query += ' ORDER BY p.item_number ASC';
    const [positions] = await db.query<PositionRow[]>(query, params);
    const formattedPositions = positions.map(pos => ({ ...pos, incumbent_name: pos.incumbent_first_name ? `${pos.incumbent_first_name} ${pos.incumbent_last_name}` : null }));
    res.json({ success: true, positions: formattedPositions });
  } catch (error) { console.error('Get Plantilla Error:', error); res.status(500).json({ success: false, message: 'Failed to fetch plantilla' }); }
};

export const getPlantillaSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result] = await db.query<SummaryRow[]>(`SELECT COUNT(*) as total, SUM(CASE WHEN is_vacant = 1 THEN 1 ELSE 0 END) as vacant, SUM(CASE WHEN is_vacant = 0 THEN 1 ELSE 0 END) as filled, SUM(COALESCE(monthly_salary, 0)) as total_monthly_salary FROM plantilla_positions`);
    const summary = result[0];
    res.json({ success: true, summary: { total: summary.total || 0, vacant: summary.vacant || 0, filled: summary.filled || 0, vacancy_rate: summary.total > 0 ? ((summary.vacant / summary.total) * 100).toFixed(1) : 0, total_monthly_salary: summary.total_monthly_salary || 0, annual_budget: (summary.total_monthly_salary || 0) * 12 } });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch summary' }); }
};

export const createPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { item_number, position_title, salary_grade, step_increment, department, monthly_salary } = req.body;
    if (!item_number || !position_title || !salary_grade) { res.status(400).json({ success: false, message: 'Item number, position title, and salary grade are required' }); return; }
    if (salary_grade < 1 || salary_grade > 33) { res.status(400).json({ success: false, message: 'Salary grade must be between 1 and 33' }); return; }
    const [result] = await db.query<ResultSetHeader>(`INSERT INTO plantilla_positions (item_number, position_title, salary_grade, step_increment, department, monthly_salary) VALUES (?, ?, ?, ?, ?, ?)`, [item_number, position_title, salary_grade, step_increment || 1, department, monthly_salary || null]);
    await logAudit(result.insertId, 'created', authReq.user.id, null, { item_number, position_title, salary_grade, step_increment, department, monthly_salary });
    res.status(201).json({ success: true, message: 'Position created successfully', id: result.insertId });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ success: false, message: 'Item number already exists' }); return; }
    res.status(500).json({ success: false, message: 'Failed to create position' });
  }
};

export const updatePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; const { id } = req.params;
    const { item_number, position_title, salary_grade, step_increment, department, is_vacant, monthly_salary } = req.body;
    const [oldData] = await db.query<PositionRow[]>('SELECT * FROM plantilla_positions WHERE id = ?', [id]);
    if (oldData.length === 0) { res.status(404).json({ success: false, message: 'Position not found' }); return; }
    await db.query(`UPDATE plantilla_positions SET item_number = ?, position_title = ?, salary_grade = ?, step_increment = ?, department = ?, is_vacant = ?, monthly_salary = ? WHERE id = ?`, [item_number, position_title, salary_grade, step_increment, department, is_vacant, monthly_salary, id]);
    await logAudit(parseInt(id), 'updated', authReq.user.id, oldData[0], { item_number, position_title, salary_grade, step_increment, department, is_vacant, monthly_salary });
    res.json({ success: true, message: 'Position updated successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update position' }); }
};

export const deletePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; const { id } = req.params;
    const [oldData] = await db.query<PositionRow[]>('SELECT * FROM plantilla_positions WHERE id = ?', [id]);
    if (oldData.length === 0) { res.status(404).json({ success: false, message: 'Position not found' }); return; }
    if (oldData[0].incumbent_id) { res.status(400).json({ success: false, message: 'Cannot delete filled position. Please vacate the position first.' }); return; }
    await db.query('DELETE FROM plantilla_positions WHERE id = ?', [id]);
    await logAudit(parseInt(id), 'deleted', authReq.user.id, oldData[0], null);
    res.json({ success: true, message: 'Position deleted successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete position' }); }
};

export const assignEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; const { id } = req.params;
    const { employee_id, start_date } = req.body;
    if (!employee_id) { res.status(400).json({ success: false, message: 'Employee ID is required' }); return; }
    const [position] = await db.query<PositionRow[]>('SELECT * FROM plantilla_positions WHERE id = ?', [id]);
    if (position.length === 0) { res.status(404).json({ success: false, message: 'Position not found' }); return; }
    if (!position[0].is_vacant) { res.status(400).json({ success: false, message: 'Position is already filled' }); return; }
    const [employee] = await db.query<EmployeeRow[]>('SELECT id, first_name, last_name FROM authentication WHERE id = ?', [employee_id]);
    if (employee.length === 0) { res.status(404).json({ success: false, message: 'Employee not found' }); return; }
    const assignDate = start_date || new Date().toISOString().split('T')[0];
    await db.query(`UPDATE plantilla_positions SET incumbent_id = ?, is_vacant = 0, filled_date = ?, vacated_date = NULL WHERE id = ?`, [employee_id, assignDate, id]);
    try { await db.query(`UPDATE authentication SET job_title = ?, \`position_title\` = ?, item_number = ?, salary_grade = ?, step_increment = ? WHERE id = ?`, [position[0].position_title, position[0].position_title, position[0].item_number, position[0].salary_grade, position[0].step_increment, employee_id]); } catch (syncError) { console.error('Profile sync error:', syncError); }
    await db.query(`INSERT INTO plantilla_position_history (position_id, employee_id, employee_name, position_title, start_date) VALUES (?, ?, ?, ?, ?)`, [id, employee_id, `${employee[0].first_name} ${employee[0].last_name}`, position[0].position_title, assignDate]);
    await logAudit(parseInt(id), 'assigned', authReq.user.id, { is_vacant: 1, incumbent_id: null }, { is_vacant: 0, incumbent_id: employee_id, employee_name: `${employee[0].first_name} ${employee[0].last_name}` });
    res.json({ success: true, message: 'Employee assigned successfully' });
  } catch (error) { console.error('Assign Employee Error:', error); res.status(500).json({ success: false, message: 'Failed to assign employee' }); }
};

export const vacatePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; const { id } = req.params;
    const { reason, end_date } = req.body;
    const [position] = await db.query<PositionRow[]>('SELECT * FROM plantilla_positions WHERE id = ?', [id]);
    if (position.length === 0) { res.status(404).json({ success: false, message: 'Position not found' }); return; }
    if (position[0].is_vacant) { res.status(400).json({ success: false, message: 'Position is already vacant' }); return; }
    const vacateDate = end_date || new Date().toISOString().split('T')[0];
    await db.query(`UPDATE plantilla_position_history SET end_date = ?, reason = ? WHERE position_id = ? AND employee_id = ? AND end_date IS NULL`, [vacateDate, reason || 'Position vacated', id, position[0].incumbent_id]);
    await db.query(`UPDATE plantilla_positions SET incumbent_id = NULL, is_vacant = 1, vacated_date = ? WHERE id = ?`, [vacateDate, id]);
    try { await db.query(`UPDATE authentication SET job_title = 'Unassigned', \`position_title\` = NULL, item_number = NULL WHERE id = ?`, [position[0].incumbent_id]); } catch (syncError) { console.error('Profile sync error:', syncError); }
    await logAudit(parseInt(id), 'vacated', authReq.user.id, { is_vacant: 0, incumbent_id: position[0].incumbent_id }, { is_vacant: 1, incumbent_id: null, reason });
    res.json({ success: true, message: 'Position vacated successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to vacate position' }); }
};

export const getPositionHistory = async (req: Request, res: Response): Promise<void> => {
  try { const { id } = req.params; const [history] = await db.query<HistoryRow[]>(`SELECT * FROM plantilla_position_history WHERE position_id = ? ORDER BY start_date DESC`, [id]); res.json({ success: true, history }); }
  catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch position history' }); }
};

export const getAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position_id, limit = '50' } = req.query;
    let query = `SELECT pal.*, pp.item_number, pp.position_title, a.first_name as actor_first_name, a.last_name as actor_last_name FROM plantilla_audit_log pal LEFT JOIN plantilla_positions pp ON pal.position_id = pp.id LEFT JOIN authentication a ON pal.actor_id = a.id WHERE 1=1`;
    const params: (string | number)[] = [];
    if (position_id) { query += ' AND pal.position_id = ?'; params.push(position_id as string); }
    query += ' ORDER BY pal.created_at DESC LIMIT ?'; params.push(parseInt(limit as string));
    const [logs] = await db.query<AuditRow[]>(query, params);
    const formattedLogs = logs.map(log => ({ ...log, actor_name: `${log.actor_first_name} ${log.actor_last_name}`, old_values: log.old_values ? JSON.parse(log.old_values) : null, new_values: log.new_values ? JSON.parse(log.new_values) : null }));
    res.json({ success: true, logs: formattedLogs });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch audit log' }); }
};

export const getAvailableEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const [employees] = await db.query<EmployeeRow[]>(`SELECT a.id, a.first_name, a.last_name, a.employee_id, a.department FROM authentication a LEFT JOIN plantilla_positions pp ON a.id = pp.incumbent_id WHERE a.role != 'admin' AND pp.id IS NULL ORDER BY a.last_name, a.first_name`);
    res.json({ success: true, employees });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch available employees' }); }
};

export const getSalarySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grade, step } = req.query;
    if (!grade) { const [schedule] = await db.query<SalaryRow[]>('SELECT * FROM salary_schedule ORDER BY salary_grade, step'); res.json({ success: true, schedule }); return; }
    const [result] = await db.query<SalaryRow[]>('SELECT monthly_salary FROM salary_schedule WHERE salary_grade = ? AND step = ?', [grade, step || 1]);
    if (result.length === 0) { res.status(404).json({ success: false, message: 'Salary not found for this grade/step' }); return; }
    res.json({ success: true, monthly_salary: result[0].monthly_salary });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch salary schedule' }); }
};
