import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, e.name, e.employee_code
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ORDER BY a.date DESC, a.time_in DESC
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "db_error" });
  }
});

router.get("/today", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, e.name, e.employee_code
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date = CURDATE()
      ORDER BY a.time_in ASC
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "db_error" });
  }
});

export default router;
