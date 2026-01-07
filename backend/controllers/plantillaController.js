import db from '../db/connection.js';

// Helper function for audit logging
const logAudit = async (positionId, action, actorId, oldValues = null, newValues = null) => {
    try {
        await db.query(
            `INSERT INTO plantilla_audit_log (position_id, action, actor_id, old_values, new_values)
             VALUES (?, ?, ?, ?, ?)`,
            [positionId, action, actorId, JSON.stringify(oldValues), JSON.stringify(newValues)]
        );
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

// Get all plantilla positions with incumbent details
export const getPlantilla = async (req, res) => {
    try {
        const { department, is_vacant } = req.query;
        let query = `
            SELECT p.*, 
                   a.first_name as incumbent_first_name, 
                   a.last_name as incumbent_last_name,
                   a.employee_id as incumbent_employee_id
            FROM plantilla_positions p
            LEFT JOIN authentication a ON p.incumbent_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (department && department !== 'All') {
            query += " AND p.department = ?";
            params.push(department);
        }

        if (is_vacant !== undefined) {
            query += " AND p.is_vacant = ?";
            params.push(is_vacant === 'true' || is_vacant === '1' ? 1 : 0);
        }

        query += " ORDER BY p.item_number ASC";

        const [positions] = await db.query(query, params);
        
        // Format response with incumbent name
        const formattedPositions = positions.map(pos => ({
            ...pos,
            incumbent_name: pos.incumbent_first_name 
                ? `${pos.incumbent_first_name} ${pos.incumbent_last_name}` 
                : null
        }));

        res.json({ success: true, positions: formattedPositions });
    } catch (error) {
        console.error('Get Plantilla Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch plantilla" });
    }
};

// Get plantilla summary statistics
export const getPlantillaSummary = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_vacant = 1 THEN 1 ELSE 0 END) as vacant,
                SUM(CASE WHEN is_vacant = 0 THEN 1 ELSE 0 END) as filled,
                SUM(COALESCE(monthly_salary, 0)) as total_monthly_salary
            FROM plantilla_positions
        `);

        const summary = result[0];
        res.json({ 
            success: true, 
            summary: {
                total: summary.total || 0,
                vacant: summary.vacant || 0,
                filled: summary.filled || 0,
                vacancy_rate: summary.total > 0 
                    ? ((summary.vacant / summary.total) * 100).toFixed(1) 
                    : 0,
                total_monthly_salary: summary.total_monthly_salary || 0,
                annual_budget: (summary.total_monthly_salary || 0) * 12
            }
        });
    } catch (error) {
        console.error('Get Summary Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch summary" });
    }
};

// Create new position
export const createPosition = async (req, res) => {
    try {
        const { item_number, position_title, salary_grade, step_increment, department, monthly_salary } = req.body;

        if (!item_number || !position_title || !salary_grade) {
            return res.status(400).json({ success: false, message: "Item number, position title, and salary grade are required" });
        }

        // Validate salary grade (1-33)
        if (salary_grade < 1 || salary_grade > 33) {
            return res.status(400).json({ success: false, message: "Salary grade must be between 1 and 33" });
        }

        const [result] = await db.query(
            `INSERT INTO plantilla_positions (item_number, position_title, salary_grade, step_increment, department, monthly_salary)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [item_number, position_title, salary_grade, step_increment || 1, department, monthly_salary || null]
        );

        // Audit log
        await logAudit(result.insertId, 'created', req.user.id, null, {
            item_number, position_title, salary_grade, step_increment, department, monthly_salary
        });

        res.status(201).json({ success: true, message: "Position created successfully", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Item number already exists" });
        }
        console.error('Create Position Error:', error);
        res.status(500).json({ success: false, message: "Failed to create position" });
    }
};

// Update position
export const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_number, position_title, salary_grade, step_increment, department, is_vacant, monthly_salary } = req.body;

        // Get old values for audit
        const [oldData] = await db.query("SELECT * FROM plantilla_positions WHERE id = ?", [id]);
        if (oldData.length === 0) {
            return res.status(404).json({ success: false, message: "Position not found" });
        }

        await db.query(
            `UPDATE plantilla_positions 
             SET item_number = ?, position_title = ?, salary_grade = ?, step_increment = ?, 
                 department = ?, is_vacant = ?, monthly_salary = ?
             WHERE id = ?`,
            [item_number, position_title, salary_grade, step_increment, department, is_vacant, monthly_salary, id]
        );

        // Audit log
        await logAudit(id, 'updated', req.user.id, oldData[0], {
            item_number, position_title, salary_grade, step_increment, department, is_vacant, monthly_salary
        });

        res.json({ success: true, message: "Position updated successfully" });
    } catch (error) {
        console.error('Update Position Error:', error);
        res.status(500).json({ success: false, message: "Failed to update position" });
    }
};

// Delete position
export const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        // Get old values for audit
        const [oldData] = await db.query("SELECT * FROM plantilla_positions WHERE id = ?", [id]);
        if (oldData.length === 0) {
            return res.status(404).json({ success: false, message: "Position not found" });
        }

        // Check if position has incumbent
        if (oldData[0].incumbent_id) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot delete filled position. Please vacate the position first." 
            });
        }

        await db.query("DELETE FROM plantilla_positions WHERE id = ?", [id]);

        // Audit log
        await logAudit(id, 'deleted', req.user.id, oldData[0], null);

        res.json({ success: true, message: "Position deleted successfully" });
    } catch (error) {
        console.error('Delete Position Error:', error);
        res.status(500).json({ success: false, message: "Failed to delete position" });
    }
};

// Assign employee to position
export const assignEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, start_date } = req.body;

        if (!employee_id) {
            return res.status(400).json({ success: false, message: "Employee ID is required" });
        }

        // Get position
        const [position] = await db.query("SELECT * FROM plantilla_positions WHERE id = ?", [id]);
        if (position.length === 0) {
            return res.status(404).json({ success: false, message: "Position not found" });
        }

        if (!position[0].is_vacant) {
            return res.status(400).json({ success: false, message: "Position is already filled" });
        }

        // Get employee details
        const [employee] = await db.query(
            "SELECT id, first_name, last_name FROM authentication WHERE id = ?", 
            [employee_id]
        );
        if (employee.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const assignDate = start_date || new Date().toISOString().split('T')[0];

        // Update position
        await db.query(
            `UPDATE plantilla_positions 
             SET incumbent_id = ?, is_vacant = 0, filled_date = ?, vacated_date = NULL
             WHERE id = ?`,
            [employee_id, assignDate, id]
        );

        // SYNC: Update employee profile in authentication table
        // This ensures the employee's official records match the plantilla position they occupy.
        try {
            await db.query(
                `UPDATE authentication 
                 SET job_title = ?, \`position_title\` = ?, item_number = ?, 
                     salary_grade = ?, step_increment = ?
                 WHERE id = ?`,
                [
                    position[0].position_title, // job_title (legacy/display)
                    position[0].position_title, // official position_title
                    position[0].item_number, 
                    position[0].salary_grade, 
                    position[0].step_increment, 
                    employee_id
                ]
            );
            console.log(`Synced plantilla details to employee id ${employee_id}`);
        } catch (syncError) {
            console.error('Profile sync error (assignment):', syncError);
            // We don't fail the whole request if sync fails, but we log it.
        }

        // Add to history
        await db.query(
            `INSERT INTO plantilla_position_history 
             (position_id, employee_id, employee_name, position_title, start_date)
             VALUES (?, ?, ?, ?, ?)`,
            [id, employee_id, `${employee[0].first_name} ${employee[0].last_name}`, 
             position[0].position_title, assignDate]
        );

        // Audit log
        await logAudit(id, 'assigned', req.user.id, 
            { is_vacant: 1, incumbent_id: null },
            { is_vacant: 0, incumbent_id: employee_id, employee_name: `${employee[0].first_name} ${employee[0].last_name}` }
        );

        res.json({ success: true, message: "Employee assigned successfully" });
    } catch (error) {
        console.error('Assign Employee Error:', error);
        res.status(500).json({ success: false, message: "Failed to assign employee" });
    }
};

// Vacate position
export const vacatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, end_date } = req.body;

        // Get position
        const [position] = await db.query("SELECT * FROM plantilla_positions WHERE id = ?", [id]);
        if (position.length === 0) {
            return res.status(404).json({ success: false, message: "Position not found" });
        }

        if (position[0].is_vacant) {
            return res.status(400).json({ success: false, message: "Position is already vacant" });
        }

        const vacateDate = end_date || new Date().toISOString().split('T')[0];

        // Update history - close the current assignment
        await db.query(
            `UPDATE plantilla_position_history 
             SET end_date = ?, reason = ?
             WHERE position_id = ? AND employee_id = ? AND end_date IS NULL`,
            [vacateDate, reason || 'Position vacated', id, position[0].incumbent_id]
        );

        // Update position
        await db.query(
            `UPDATE plantilla_positions 
             SET incumbent_id = NULL, is_vacant = 1, vacated_date = ?
             WHERE id = ?`,
            [vacateDate, id]
        );

        // SYNC: Clear plantilla details in employee profile
        try {
            await db.query(
                `UPDATE authentication 
                 SET job_title = 'Unassigned', \`position_title\` = NULL, item_number = NULL 
                 WHERE id = ?`,
                [position[0].incumbent_id]
            );
            console.log(`Cleared plantilla details for employee id ${position[0].incumbent_id}`);
        } catch (syncError) {
            console.error('Profile sync error (vacate):', syncError);
        }

        // Audit log
        await logAudit(id, 'vacated', req.user.id, 
            { is_vacant: 0, incumbent_id: position[0].incumbent_id },
            { is_vacant: 1, incumbent_id: null, reason }
        );

        res.json({ success: true, message: "Position vacated successfully" });
    } catch (error) {
        console.error('Vacate Position Error:', error);
        res.status(500).json({ success: false, message: "Failed to vacate position" });
    }
};

// Get position history
export const getPositionHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const [history] = await db.query(
            `SELECT * FROM plantilla_position_history 
             WHERE position_id = ? 
             ORDER BY start_date DESC`,
            [id]
        );

        res.json({ success: true, history });
    } catch (error) {
        console.error('Get Position History Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch position history" });
    }
};

// Get audit log
export const getAuditLog = async (req, res) => {
    try {
        const { position_id, limit = 50 } = req.query;

        let query = `
            SELECT pal.*, 
                   pp.item_number, pp.position_title,
                   a.first_name as actor_first_name, a.last_name as actor_last_name
            FROM plantilla_audit_log pal
            LEFT JOIN plantilla_positions pp ON pal.position_id = pp.id
            LEFT JOIN authentication a ON pal.actor_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (position_id) {
            query += " AND pal.position_id = ?";
            params.push(position_id);
        }

        query += " ORDER BY pal.created_at DESC LIMIT ?";
        params.push(parseInt(limit));

        const [logs] = await db.query(query, params);

        const formattedLogs = logs.map(log => ({
            ...log,
            actor_name: `${log.actor_first_name} ${log.actor_last_name}`,
            old_values: log.old_values ? JSON.parse(log.old_values) : null,
            new_values: log.new_values ? JSON.parse(log.new_values) : null
        }));

        res.json({ success: true, logs: formattedLogs });
    } catch (error) {
        console.error('Get Audit Log Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch audit log" });
    }
};

// Get available employees (not assigned to any position)
export const getAvailableEmployees = async (req, res) => {
    try {
        const [employees] = await db.query(`
            SELECT a.id, a.first_name, a.last_name, a.employee_id, a.department
            FROM authentication a
            LEFT JOIN plantilla_positions pp ON a.id = pp.incumbent_id
            WHERE a.role != 'admin' AND pp.id IS NULL
            ORDER BY a.last_name, a.first_name
        `);

        res.json({ success: true, employees });
    } catch (error) {
        console.error('Get Available Employees Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch available employees" });
    }
};

// Get monthly salary based on grade and step from salary schedule
export const getSalarySchedule = async (req, res) => {
    try {
        const { grade, step } = req.query;
        
        if (!grade) {
            // If no grade provided, return the whole schedule (useful for dropdown lookups)
            const [schedule] = await db.query("SELECT * FROM salary_schedule ORDER BY salary_grade, step");
            return res.json({ success: true, schedule });
        }

        const [result] = await db.query(
            "SELECT monthly_salary FROM salary_schedule WHERE salary_grade = ? AND step = ?",
            [grade, step || 1]
        );

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Salary not found for this grade/step" });
        }

        res.json({ success: true, monthly_salary: result[0].monthly_salary });
    } catch (error) {
        console.error('Get Salary Schedule Error:', error);
        res.status(500).json({ success: false, message: "Failed to fetch salary schedule" });
    }
};
