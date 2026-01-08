import db from '../db/connection.js';

// Get public department list (for registration - no auth required)
export const getPublicDepartments = async (req, res) => {
  try {
    const query = `SELECT id, name FROM departments ORDER BY name ASC`;
    const [departments] = await db.query(query);
    res.status(200).json({ success: true, departments });
  } catch (error) {
    console.error('Get Public Departments Error:', error);
    res.status(500).json({ success: false, message: "Failed to fetch departments" });
  }
};

// Get all departments with employee count
export const getDepartments = async (req, res) => {
  try {
    const query = `
      SELECT d.*, 
      (SELECT COUNT(*) FROM authentication WHERE department = d.name) as employee_count 
      FROM departments d
      ORDER BY d.name ASC
    `;
    const [departments] = await db.query(query);
    res.status(200).json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch departments" });
  }
};

// Get single department details
export const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [depts] = await db.query("SELECT * FROM departments WHERE id = ?", [id]);
    if (depts.length === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    const department = depts[0];

    // Get employees in this department
    const [employees] = await db.query(
      "SELECT id, first_name, last_name, email, job_title, avatar_url, employment_status, date_hired FROM authentication WHERE department = ?", 
      [department.name]
    );

    res.status(200).json({ success: true, department, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch department details" });
  }
};

// Get employees available to add to a department (not already in that department)
export const getAvailableEmployees = async (req, res) => {
  const { id } = req.params;
  const { search } = req.query;
  
  try {
    // Get department name first
    const [depts] = await db.query("SELECT name FROM departments WHERE id = ?", [id]);
    if (depts.length === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    const departmentName = depts[0].name;

    // Get employees NOT in this department
    let query = `
      SELECT id, employee_id, first_name, last_name, email, job_title, department, avatar_url 
      FROM authentication 
      WHERE (department IS NULL OR department != ?)
    `;
    const params = [departmentName];

    // Add search filter if provided
    if (search && search.trim()) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY last_name ASC LIMIT 20";

    const [employees] = await db.query(query, params);
    res.status(200).json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch available employees" });
  }
};

// Assign an employee to a department
export const assignEmployeeToDepartment = async (req, res) => {
  const { id } = req.params; // Department ID
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Employee ID is required" });
  }

  try {
    // Get department name
    const [depts] = await db.query("SELECT name FROM departments WHERE id = ?", [id]);
    if (depts.length === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    const departmentName = depts[0].name;

    // Update employee's department
    const [result] = await db.query(
      "UPDATE authentication SET department = ? WHERE id = ?",
      [departmentName, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee assigned to department successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to assign employee to department" });
  }
};

// Remove an employee from a department (set department to null)
export const removeEmployeeFromDepartment = async (req, res) => {
  const { id, employeeId } = req.params;

  try {
    const [result] = await db.query(
      "UPDATE authentication SET department = NULL WHERE id = ?",
      [employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee removed from department" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove employee from department" });
  }
};

// Create a new department
export const createDepartment = async (req, res) => {
  const { name, description, head_of_department } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: "Department name is required" });
  }

  try {
    const [existing] = await db.query("SELECT * FROM departments WHERE name = ?", [name]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Department already exists" });
    }

    await db.query(
      "INSERT INTO departments (name, description, head_of_department) VALUES (?, ?, ?)",
      [name, description, head_of_department]
    );

    res.status(201).json({ success: true, message: "Department created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create department" });
  }
};

// Update a department
export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description, head_of_department } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get current department name
    const [currentDept] = await connection.query("SELECT name FROM departments WHERE id = ?", [id]);
    if (currentDept.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Department not found" });
    }
    const oldName = currentDept[0].name;

    // Optional: Check if new name conflicts if name is being changed
    if (name && name !== oldName) {
        const [existing] = await connection.query("SELECT * FROM departments WHERE name = ? AND id != ?", [name, id]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: "Department name already taken" });
        }
    }

    const updates = [];
    const params = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (description) { updates.push("description = ?"); params.push(description); }
    if (head_of_department) { updates.push("head_of_department = ?"); params.push(head_of_department); }

    if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "No changes provided" });
    }

    params.push(id);

    await connection.query(`UPDATE departments SET ${updates.join(", ")} WHERE id = ?`, params);

    // If name changed, update all employees in this department
    if (name && name !== oldName) {
        await connection.query("UPDATE authentication SET department = ? WHERE department = ?", [name, oldName]);
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Department updated successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Update Department Error:", error);
    res.status(500).json({ success: false, message: "Failed to update department" });
  } finally {
    connection.release();
  }
};

// Delete a department
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM departments WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete department" });
  }
};

