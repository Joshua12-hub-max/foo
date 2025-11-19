import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM employees ORDER BY name");
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "db_error" });
  }
});

export default router;
