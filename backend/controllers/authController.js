import db from "../db/connection.js";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../utils/token.js";

// ======================== REGISTER USER ========================
export const registerUser = async (req, res) => {
  const { name, role, employeeId, password } = req.body;

  try {
    // Check if employee already exists
    const [existing] = await db.query(
      "SELECT * FROM attendance WHERE employee_id = ? LIMIT 1",
      [employeeId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Employee ID already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user securely (no visible password)
    await db.query(
      "INSERT INTO attendance (employee_id, employee_name, role, password_hash, status, date) VALUES (?, ?, ?, ?, 'Active', CURDATE())",
      [employeeId, name, role, hashedPassword]
    );

    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== LOGIN USER ========================
export const loginUser = async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    // Fetch user by employeeId (latest record for password check)
    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1",
      [employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Employee ID not found." });
    }

    const user = rows[0];

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is not activated." });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Check if today's attendance record exists; if not, create one
    const [todayRow] = await db.query(
      "SELECT * FROM attendance WHERE employee_id = ? AND date = CURDATE()",
      [employeeId]
    );

    if (todayRow.length === 0) {
      await db.query(
        "INSERT INTO attendance (employee_id, employee_name, role, password_hash, status, date) VALUES (?, ?, ?, ?, 'Active', CURDATE())",
        [user.employee_id, user.employee_name, user.role, user.password_hash]
      );
    }

    // Mark as logged in today
    await db.query(
      "UPDATE attendance SET is_portal_logged = 1 WHERE employee_id = ? AND date = CURDATE()",
      [employeeId]
    );

    // Generate JWT tokens
    const payload = {
      employeeId: user.employee_id,
      role: user.role,
      name: user.employee_name,
    };

    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send user info + access token to frontend
    res.json({
      accessToken,
      employeeId: user.employee_id,
      role: user.role,
      name: user.employee_name,
      department: user.department || "Not Assigned",
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== REFRESH TOKEN ========================
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = verifyRefreshToken(token);
    const newAccessToken = createAccessToken({
      employeeId: decoded.employeeId,
      role: decoded.role,
      name: decoded.name,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh Error:", error);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// ======================== LOGOUT USER ========================
export const logoutUser = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ message: "Logged out successfully" });
};