import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

// ==========================================
// EMPLOYEE CRUD OPERATIONS
// ==========================================

// Get all employees with optional department filter
export const getAllEmployees = async (req, res) => {
    try {
        const { department } = req.query;
        let query = `SELECT id, employee_id, first_name, last_name, email, department, 
                     job_title, employment_status, role, avatar_url, date_hired, 
                     position_title, station, appointment_type 
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
        
        // Remove sensitive fields from response
        delete employee.password_hash;
        delete employee.verification_token;
        delete employee.reset_password_token;
        delete employee.reset_password_expires;

        // Fetch related data
        const [skills] = await db.query(
            "SELECT * FROM employee_skills WHERE employee_id = ? ORDER BY skill_name",
            [id]
        );
        const [education] = await db.query(
            "SELECT * FROM employee_education WHERE employee_id = ? ORDER BY start_date DESC",
            [id]
        );
        const [documents] = await db.query(
            "SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC",
            [id]
        );
        const [emergencyContacts] = await db.query(
            "SELECT * FROM employee_emergency_contacts WHERE employee_id = ? ORDER BY is_primary DESC",
            [id]
        );

        res.json({ 
            success: true, 
            employee: {
                ...employee,
                skills,
                education,
                documents,
                emergencyContacts
            }
        });
    } catch (error) {
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
            salary_grade, step_increment, appointment_type, station, position_title
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

// Update employee - expanded whitelist for all government fields
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Whitelist of allowed columns (includes all government worker fields)
        const allowedColumns = [
            // Basic info
            'first_name', 'last_name', 'email', 'department', 'job_title',
            'role', 'employment_status', 'employee_id', 'avatar_url', 'date_hired',
            // Personal info
            'birth_date', 'gender', 'civil_status', 'nationality', 'blood_type',
            'height_cm', 'weight_kg',
            // Contact info
            'phone_number', 'address', 'permanent_address', 
            'emergency_contact', 'emergency_contact_number',
            // Government IDs
            'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number', 'gsis_number',
            // Employment details
            'salary_grade', 'step_increment', 'appointment_type', 'office_address',
            'station', 'position_title', 'item_number', 'first_day_of_service', 'supervisor'
        ];
        
        // Filter updates to only include whitelisted columns
        const safeUpdates = {};
        for (const key of Object.keys(updates)) {
            if (allowedColumns.includes(key)) {
                safeUpdates[key] = updates[key];
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return res.status(400).json({ success: false, message: "No valid updates provided" });
        }

        // Handle Plantilla Item Swap
        if (updates.item_number !== undefined) {
            const [currentEmp] = await db.query("SELECT item_number FROM authentication WHERE id = ?", [id]);
            const oldItem = currentEmp[0]?.item_number;
            const newItem = updates.item_number;

            // Only proceed if item number actually changed
            if (oldItem !== newItem) {
                // 1. Mark new item as filled (if it exists and is valid)
                if (newItem && newItem !== 'N/A') {
                     const [plantilla] = await db.query("SELECT id, is_vacant FROM plantilla_positions WHERE item_number = ?", [newItem]);
                     if (plantilla.length > 0) {
                         if (!plantilla[0].is_vacant) {
                             return res.status(409).json({ success: false, message: `Plantilla Item ${newItem} is already filled.` });
                         }
                         await db.query("UPDATE plantilla_positions SET is_vacant = FALSE WHERE item_number = ?", [newItem]);
                     }
                }

                // 2. Mark old item as vacant
                if (oldItem && oldItem !== 'N/A') {
                    await db.query("UPDATE plantilla_positions SET is_vacant = TRUE WHERE item_number = ?", [oldItem]);
                }
            }
        }

        // Validate department if it's being updated
        if (safeUpdates.department) {
            const [deptExists] = await db.query("SELECT id FROM departments WHERE name = ?", [safeUpdates.department]);
            if (deptExists.length === 0) {
                return res.status(400).json({ success: false, message: "Invalid department" });
            }
        }

        const fields = Object.keys(safeUpdates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(safeUpdates);
        values.push(id);

        await db.query(`UPDATE authentication SET ${fields} WHERE id = ?`, values);

        res.json({ success: true, message: "Employee updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update employee" });
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

export const getEmployeeDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const [documents] = await db.query(
            "SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC",
            [id]
        );
        res.json({ success: true, documents });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch documents" });
    }
};

export const addEmployeeDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { document_name, document_type, file_path, file_size, mime_type } = req.body;

        if (!document_name || !file_path) {
            return res.status(400).json({ success: false, message: "Document name and file path required" });
        }

        const uploadedBy = req.user?.id || null;

        const [result] = await db.query(
            `INSERT INTO employee_documents 
             (employee_id, document_name, document_type, file_path, file_size, mime_type, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, document_name, document_type || 'Other', file_path, file_size || null, mime_type || null, uploadedBy]
        );

        res.status(201).json({ success: true, message: "Document added", documentId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add document" });
    }
};

export const deleteEmployeeDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;
        await db.query("DELETE FROM employee_documents WHERE id = ? AND employee_id = ?", [documentId, id]);
        res.json({ success: true, message: "Document deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete document" });
    }
};
