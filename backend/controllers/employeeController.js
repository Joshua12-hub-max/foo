import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

// ==========================================
// EMPLOYEE CRUD OPERATIONS
// ==========================================

// Get all employees with optional department filter
export const getAllEmployees = async (req, res) => {
    try {
        const { department } = req.query;
        // Select only non-sensitive fields for the list view
        let query = `SELECT id, employee_id, first_name, last_name, email, department, 
                     job_title, employment_status, role, avatar_url, date_hired, 
                     position_title, station, appointment_type, item_number,
                     birth_date, gender 
                     FROM authentication`;
        const params = [];

        if (department && department !== 'All Departments') {
            query += " WHERE department = ?";
            params.push(department);
        }

        query += " ORDER BY last_name ASC";

        const [employees] = await db.query(query, params);
        res.json({ success: true, employees });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch employees" });
    }
};

// Get single employee with all details
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [employees] = await db.query("SELECT * FROM authentication WHERE id = ?", [id]);

        if (employees.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const employee = employees[0];
        
        // Remove strictly internal fields
        delete employee.password_hash;
        delete employee.verification_token;
        delete employee.reset_password_token;
        delete employee.reset_password_expires;

        // Security: PII Filtering for Non-Admins viewing others
        const requester = req.user;
        const isSelf = requester.id == id;
        const isAdmin = ['admin', 'hr'].includes(requester.role?.toLowerCase());

        if (!isSelf && !isAdmin) {
            // Hide Sensitive PII
            delete employee.sss_number;
            delete employee.gsis_number;
            delete employee.philhealth_number;
            delete employee.pagibig_number;
            delete employee.tin_number;
            delete employee.phone_number;
            delete employee.address;
            delete employee.permanent_address;
            delete employee.birth_date;
            delete employee.emergency_contact;
            delete employee.emergency_contact_number;
            // Keep basic info: Name, Email, Dept, Job Title, Avatar
        }

        // Fetch related data (Non-admins viewing others only get basic public skills/education if needed, or filter those too)
        // For now, we assume skills/education are "public" within the company, but documents are definitely sensitive.
        
        const [skills] = await db.query(
            "SELECT * FROM employee_skills WHERE employee_id = ? ORDER BY skill_name",
            [id]
        );
        const [education] = await db.query(
            "SELECT * FROM employee_education WHERE employee_id = ? ORDER BY start_date DESC",
            [id]
        );
        


        const [emergencyContacts] = await db.query(
            "SELECT * FROM employee_emergency_contacts WHERE employee_id = ? ORDER BY is_primary DESC",
            [id]
        );
        
        // Filter contacts for non-admins
        let finalContacts = emergencyContacts;
        if (!isSelf && !isAdmin) {
            finalContacts = []; // Don't show emergency contacts to strangers
        }

        res.json({ 
            success: true, 
            employee: {
                ...employee,
                skills,
                education,

                emergencyContacts: finalContacts
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch employee" });
    }
};

// Create new employee (Admin only)
export const createEmployee = async (req, res) => {
    try {
        const { 
            first_name, last_name, email, department, job_title, role, 
            employment_status, employee_id, password,
            // Government worker fields
            birth_date, gender, civil_status, nationality,
            phone_number, address, permanent_address,
            sss_number, philhealth_number, pagibig_number, tin_number, gsis_number,
            salary_grade, step_increment, appointment_type, station, position_title,
            item_number
        } = req.body;

        // Basic validation
        if (!first_name || !last_name || !email || !department || !role) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Validate department exists
        const [deptExists] = await db.query("SELECT id FROM departments WHERE name = ?", [department]);
        if (deptExists.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid department" });
        }

        // Check if email or employee_id exists
        const [existing] = await db.query(
            "SELECT id FROM authentication WHERE email = ? OR employee_id = ?", 
            [email, employee_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "Email or Employee ID already exists" });
        }

        // Generate ID if not provided
        const finalEmployeeId = employee_id || `EMP-${Date.now().toString().slice(-6)}`;

        // Hash password (default to 'password123' if not provided)
        const passwordToHash = password || 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);

        // Check and update Plantilla status if item number is provided
        const finalItemNumber = item_number || null;
        if (finalItemNumber && finalItemNumber !== 'N/A') {
             const [plantilla] = await db.query("SELECT id, is_vacant FROM plantilla_positions WHERE item_number = ?", [finalItemNumber]);
             
             // If item exists, check vacancy
             if (plantilla.length > 0) {
                 if (!plantilla[0].is_vacant) {
                     return res.status(409).json({ success: false, message: `Plantilla Item ${finalItemNumber} is already filled.` });
                 }
                 // Mark as filled
                 await db.query("UPDATE plantilla_positions SET is_vacant = FALSE WHERE item_number = ?", [finalItemNumber]);
             }
        }

        await db.query(
            `INSERT INTO authentication 
            (first_name, last_name, email, department, job_title, role, employment_status, 
             employee_id, password_hash, is_verified,
             birth_date, gender, civil_status, nationality, phone_number, address, permanent_address,
             sss_number, philhealth_number, pagibig_number, tin_number, gsis_number,
             salary_grade, step_increment, appointment_type, station, position_title, item_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, department, job_title || 'N/A', role, 
             employment_status || 'Active', finalEmployeeId, hashedPassword,
             birth_date || null, gender || null, civil_status || null, nationality || 'Filipino',
             phone_number || null, address || null, permanent_address || null,
             sss_number || null, philhealth_number || null, pagibig_number || null, 
             tin_number || null, gsis_number || null,
             salary_grade || null, step_increment || 1, appointment_type || null, 
             station || null, position_title || null, finalItemNumber]
        );

        res.status(201).json({ success: true, message: "Employee created successfully", employeeId: finalEmployeeId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create employee" });
    }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deleting self
        if (req.user.id == id) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }

        // Get info before delete to free up plantilla
        const [emp] = await db.query("SELECT item_number FROM authentication WHERE id = ?", [id]);

        await db.query("DELETE FROM authentication WHERE id = ?", [id]);

        // Free up plantilla item
        if (emp.length > 0 && emp[0].item_number && emp[0].item_number !== 'N/A') {
            await db.query("UPDATE plantilla_positions SET is_vacant = TRUE WHERE item_number = ?", [emp[0].item_number]);
        }

        res.json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete employee" });
    }
};

// Update employee (Admin only)
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Get current employee data
        const [existing] = await db.query("SELECT * FROM authentication WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const currentEmployee = existing[0];

        // Define allowed fields for update (exclude sensitive fields)
        const allowedFields = [
            'first_name', 'last_name', 'email', 'department', 'job_title', 'role',
            'employment_status', 'employee_id', 'birth_date', 'gender', 'civil_status',
            'nationality', 'phone_number', 'address', 'permanent_address',
            'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number', 'gsis_number',
            'salary_grade', 'step_increment', 'appointment_type', 'station', 'position_title',
            'item_number', 'date_hired', 'avatar_url'
        ];

        // Build dynamic update query
        const setClauses = [];
        const params = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                params.push(updates[field] === '' ? null : updates[field]);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update" });
        }

        // Handle plantilla item number changes
        const newItemNumber = updates.item_number;
        const oldItemNumber = currentEmployee.item_number;

        if (newItemNumber !== undefined && newItemNumber !== oldItemNumber) {
            // Free old item if exists
            if (oldItemNumber && oldItemNumber !== 'N/A') {
                await db.query("UPDATE plantilla_positions SET is_vacant = TRUE WHERE item_number = ?", [oldItemNumber]);
            }
            // Mark new item as filled if exists
            if (newItemNumber && newItemNumber !== 'N/A') {
                const [plantilla] = await db.query("SELECT id, is_vacant FROM plantilla_positions WHERE item_number = ?", [newItemNumber]);
                if (plantilla.length > 0) {
                    if (!plantilla[0].is_vacant) {
                        return res.status(409).json({ success: false, message: `Plantilla Item ${newItemNumber} is already filled.` });
                    }
                    await db.query("UPDATE plantilla_positions SET is_vacant = FALSE WHERE item_number = ?", [newItemNumber]);
                }
            }
        }

        // Check email uniqueness if email is being changed
        if (updates.email && updates.email !== currentEmployee.email) {
            const [emailExists] = await db.query(
                "SELECT id FROM authentication WHERE email = ? AND id != ?", 
                [updates.email, id]
            );
            if (emailExists.length > 0) {
                return res.status(409).json({ success: false, message: "Email already exists" });
            }
        }

        // Check employee_id uniqueness if being changed
        if (updates.employee_id && updates.employee_id !== currentEmployee.employee_id) {
            const [idExists] = await db.query(
                "SELECT id FROM authentication WHERE employee_id = ? AND id != ?", 
                [updates.employee_id, id]
            );
            if (idExists.length > 0) {
                return res.status(409).json({ success: false, message: "Employee ID already exists" });
            }
        }

        params.push(id);
        await db.query(`UPDATE authentication SET ${setClauses.join(', ')} WHERE id = ?`, params);

        res.json({ success: true, message: "Employee updated successfully" });
    } catch (error) {
        console.error("Update employee error:", error);
        res.status(500).json({ success: false, message: "Failed to update employee" });
    }
};

// Revert employee status (Admin only) - For reversing memo effects like termination/suspension
export const revertEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_status = 'Active', reason } = req.body;

        // Get current employee data
        const [existing] = await db.query("SELECT * FROM authentication WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const currentEmployee = existing[0];
        const oldStatus = currentEmployee.employment_status;

        // Update employee status to Active (or specified status)
        await db.query(
            "UPDATE authentication SET employment_status = ? WHERE id = ?",
            [new_status, id]
        );

        console.log(`[Admin Action] Employee ${id} status reverted from '${oldStatus}' to '${new_status}'. Reason: ${reason || 'Not specified'}`);

        res.json({ 
            success: true, 
            message: `Employee status changed from ${oldStatus} to ${new_status}`,
            previousStatus: oldStatus,
            newStatus: new_status
        });
    } catch (error) {
        console.error("Revert employee status error:", error);
        res.status(500).json({ success: false, message: "Failed to revert employee status" });
    }
};

// ==========================================
// EMPLOYEE SKILLS
// ==========================================

export const getEmployeeSkills = async (req, res) => {
    try {
        const { id } = req.params;
        const [skills] = await db.query(
            "SELECT * FROM employee_skills WHERE employee_id = ? ORDER BY skill_name",
            [id]
        );
        res.json({ success: true, skills });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch skills" });
    }
};

export const addEmployeeSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { skill_name, category, proficiency_level, years_experience } = req.body;

        if (!skill_name) {
            return res.status(400).json({ success: false, message: "Skill name is required" });
        }

        const [result] = await db.query(
            `INSERT INTO employee_skills (employee_id, skill_name, category, proficiency_level, years_experience)
             VALUES (?, ?, ?, ?, ?)`,
            [id, skill_name, category || 'Technical', proficiency_level || 'Intermediate', years_experience || null]
        );

        res.status(201).json({ success: true, message: "Skill added", skillId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add skill" });
    }
};

export const deleteEmployeeSkill = async (req, res) => {
    try {
        const { id, skillId } = req.params;
        await db.query("DELETE FROM employee_skills WHERE id = ? AND employee_id = ?", [skillId, id]);
        res.json({ success: true, message: "Skill deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete skill" });
    }
};

// ==========================================
// EMPLOYEE EDUCATION
// ==========================================

export const getEmployeeEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const [education] = await db.query(
            "SELECT * FROM employee_education WHERE employee_id = ? ORDER BY start_date DESC",
            [id]
        );
        res.json({ success: true, education });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch education" });
    }
};

export const addEmployeeEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const { institution, degree, field_of_study, start_date, end_date, is_current, type, description } = req.body;

        if (!institution) {
            return res.status(400).json({ success: false, message: "Institution is required" });
        }

        const [result] = await db.query(
            `INSERT INTO employee_education 
             (employee_id, institution, degree, field_of_study, start_date, end_date, is_current, type, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, institution, degree || null, field_of_study || null, start_date || null, 
             end_date || null, is_current || false, type || 'Education', description || null]
        );

        res.status(201).json({ success: true, message: "Education added", educationId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add education" });
    }
};

export const deleteEmployeeEducation = async (req, res) => {
    try {
        const { id, educationId } = req.params;
        await db.query("DELETE FROM employee_education WHERE id = ? AND employee_id = ?", [educationId, id]);
        res.json({ success: true, message: "Education deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete education" });
    }
};

// ==========================================
// EMPLOYEE EMERGENCY CONTACTS
// ==========================================

export const getEmployeeContacts = async (req, res) => {
    try {
        const { id } = req.params;
        const [contacts] = await db.query(
            "SELECT * FROM employee_emergency_contacts WHERE employee_id = ? ORDER BY is_primary DESC",
            [id]
        );
        res.json({ success: true, contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch contacts" });
    }
};

export const addEmployeeContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, relationship, phone_number, email, address, is_primary } = req.body;

        if (!name || !relationship || !phone_number) {
            return res.status(400).json({ success: false, message: "Name, relationship, and phone are required" });
        }

        // If setting as primary, unset other primaries first
        if (is_primary) {
            await db.query("UPDATE employee_emergency_contacts SET is_primary = FALSE WHERE employee_id = ?", [id]);
        }

        const [result] = await db.query(
            `INSERT INTO employee_emergency_contacts 
             (employee_id, name, relationship, phone_number, email, address, is_primary)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, relationship, phone_number, email || null, address || null, is_primary || false]
        );

        res.status(201).json({ success: true, message: "Contact added", contactId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add contact" });
    }
};

export const deleteEmployeeContact = async (req, res) => {
    try {
        const { id, contactId } = req.params;
        await db.query("DELETE FROM employee_emergency_contacts WHERE id = ? AND employee_id = ?", [contactId, id]);
        res.json({ success: true, message: "Contact deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete contact" });
    }
};

// ==========================================
// EMPLOYEE DOCUMENTS
// ==========================================


