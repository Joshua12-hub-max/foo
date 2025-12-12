import db from '../db/connection.js';

// Get all plantilla positions
export const getPlantilla = async (req, res) => {
  try {
    const { department, is_vacant } = req.query;
    let query = "SELECT * FROM plantilla_positions WHERE 1=1";
    const params = [];

    if (department && department !== 'All') {
      query += " AND department = ?";
      params.push(department);
    }

    if (is_vacant !== undefined) {
      query += " AND is_vacant = ?";
      params.push(is_vacant === 'true' || is_vacant === '1' ? 1 : 0);
    }
    
    query += " ORDER BY item_number ASC";

    const [positions] = await db.query(query, params);
    res.json({ success: true, positions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch plantilla" });
  }
};

// Create new position
export const createPosition = async (req, res) => {
  try {
    const { item_number, position_title, salary_grade, step_increment, department } = req.body;

    if (!item_number || !position_title || !salary_grade) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    await db.query(
      `INSERT INTO plantilla_positions (item_number, position_title, salary_grade, step_increment, department)
       VALUES (?, ?, ?, ?, ?)`,
      [item_number, position_title, salary_grade, step_increment || 1, department]
    );

    res.status(201).json({ success: true, message: "Position created" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: "Item number already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create position" });
  }
};

// Update position
export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_number, position_title, salary_grade, step_increment, department, is_vacant } = req.body;

    await db.query(
      `UPDATE plantilla_positions 
       SET item_number = ?, position_title = ?, salary_grade = ?, step_increment = ?, department = ?, is_vacant = ?
       WHERE id = ?`,
      [item_number, position_title, salary_grade, step_increment, department, is_vacant, id]
    );

    res.json({ success: true, message: "Position updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update position" });
  }
};

// Delete position
export const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM plantilla_positions WHERE id = ?", [id]);
    res.json({ success: true, message: "Position deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete position" });
  }
};
