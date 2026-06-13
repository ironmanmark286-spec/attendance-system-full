const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

const router = express.Router();

const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../../uploads/profiles");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname || ".jpg"));
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

let employeeColumnsReady = false;

async function ensureEmployeeColumns() {
  if (employeeColumnsReady) return;
  let dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
  if (!dbName) {
    const [dbRows] = await pool.query("SELECT DATABASE() AS db_name");
    dbName = dbRows[0]?.db_name;
  }
  const required = {
    profile_photo: "ALTER TABLE employees ADD COLUMN profile_photo VARCHAR(255) DEFAULT NULL",
    shift_start_time: "ALTER TABLE employees ADD COLUMN shift_start_time TIME DEFAULT NULL",
    shift_end_time: "ALTER TABLE employees ADD COLUMN shift_end_time TIME DEFAULT NULL",
    standard_hours: "ALTER TABLE employees ADD COLUMN standard_hours DECIMAL(5,2) DEFAULT NULL",
    weekly_off_days: "ALTER TABLE employees ADD COLUMN weekly_off_days VARCHAR(50) DEFAULT NULL"
  };
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees'`,
    [dbName]
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  for (const [column, sql] of Object.entries(required)) {
    if (!existing.has(column)) {
      await pool.query(sql);
    }
  }
  employeeColumnsReady = true;
}

// Current logged-in employee profile (mobile app)
router.get("/me", auth, async (req, res) => {
  try {
    await ensureEmployeeColumns();
    if (req.user.role !== "EMPLOYEE") {
      return res.status(403).json({ message: "Employees only" });
    }
    const empId = req.user.employee_id || req.user.id;
    const [rows] = await pool.query(
      `SELECT e.emp_code, e.name, e.designation, e.status, e.created_at, e.profile_photo,
        e.shift_start_time, e.shift_end_time, e.standard_hours, e.weekly_off_days, c.settings
       FROM employees e 
       JOIN companies c ON e.company_id = c.id 
       WHERE e.id = ? AND e.company_id = ?`,
      [empId, req.user.company_id]
    );
    if (!rows.length) return res.status(404).json({ message: "Employee not found" });
    const e = rows[0];
    
    let settings = {};
    try { settings = JSON.parse(e.settings || "{}"); } catch(err){}

    res.json({
      name: e.name,
      emp_code: e.emp_code,
      designation: e.designation || "Employee",
      department: e.designation || "General",
      status: e.status,
      created_at: e.created_at,
      profile_photo: e.profile_photo,
      shift_start_time: e.shift_start_time,
      shift_end_time: e.shift_end_time,
      standard_hours: e.standard_hours,
      weekly_off_days: e.weekly_off_days,
      office_lat: settings.office_lat ?? null,
      office_lng: settings.office_lng ?? null,
      geofence_radius: settings.geofence_radius ?? 50 // default 50 meters limit
    });
  } catch (err) {
    console.error("Error fetching employee profile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.post("/me/photo", auth, roles("EMPLOYEE"), uploadPhoto.single("photo"), async (req, res) => {
  try {
    await ensureEmployeeColumns();
    if (!req.file) {
      return res.status(400).json({ message: "Photo is required" });
    }

    const photoPath = "/uploads/profiles/" + req.file.filename;
    const empId = req.user.employee_id || req.user.id;

    const [oldRows] = await pool.query(
      "SELECT profile_photo FROM employees WHERE id = ? AND company_id = ?",
      [empId, req.user.company_id]
    );

    await pool.query(
      "UPDATE employees SET profile_photo = ? WHERE id = ? AND company_id = ?",
      [photoPath, empId, req.user.company_id]
    );

    const oldPhoto = oldRows[0]?.profile_photo;
    if (oldPhoto && oldPhoto.startsWith("/uploads/profiles/")) {
      const oldPath = path.join(__dirname, "../..", oldPhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    res.json({ message: "Profile photo updated", profile_photo: photoPath });
  } catch (err) {
    console.error("Profile photo upload error:", err);
    res.status(500).json({ message: "Failed to upload profile photo" });
  }
});

// Get employees for the company
router.get("/", auth, roles("ADMIN"), async (req, res) => {
  try {
    await ensureEmployeeColumns();
    const [rows] = await pool.query(
      `SELECT id, emp_code, name, status, designation, profile_photo, shift_start_time, shift_end_time,
        standard_hours, weekly_off_days, created_at
       FROM employees WHERE company_id = ? ORDER BY created_at DESC`,
      [req.user.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

// Add a new employee
router.post("/", auth, roles("ADMIN"), async (req, res) => {
  try {
    await ensureEmployeeColumns();
    const { empCode, name, password, designation, shift_start_time, shift_end_time, standard_hours, weekly_off_days } = req.body;
    if (!empCode || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const [empCount] = await pool.query("SELECT COUNT(*) as count FROM employees WHERE company_id = ?", [req.user.company_id]);
    const count = empCount[0].count;
    
    const [compRows] = await pool.query("SELECT subscription_plan FROM companies WHERE id = ?", [req.user.company_id]);
    const plan = compRows[0]?.subscription_plan || 'FREE';
    if (plan !== "YEARLY" && count >= 50) {
      return res.status(403).json({
        message: "Employee limit reached! Monthly/Trial plan allows max 50 employees. Upgrade to Yearly plan for unlimited employees.",
        code: "EMPLOYEE_LIMIT_REACHED",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM employees WHERE emp_code = ? AND company_id = ?",
      [empCode, req.user.company_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Employee code already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO employees
       (company_id, emp_code, name, designation, password_hash, shift_start_time, shift_end_time, standard_hours, weekly_off_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.company_id,
        empCode,
        name,
        designation || 'Employee',
        hash,
        shift_start_time || null,
        shift_end_time || null,
        standard_hours || null,
        weekly_off_days || null
      ]
    );

    res.status(201).json({ message: "Employee added successfully", empCode, name, designation: designation || 'Employee' });
  } catch (err) {
    console.error("Error adding employee:", err);
    res.status(500).json({ message: "Failed to add employee" });
  }
});

router.put("/:id/shift", auth, roles("ADMIN", "HR"), async (req, res) => {
  try {
    await ensureEmployeeColumns();
    const { shift_start_time, shift_end_time, standard_hours, weekly_off_days } = req.body;
    const [result] = await pool.query(
      `UPDATE employees
       SET shift_start_time = ?, shift_end_time = ?, standard_hours = ?, weekly_off_days = ?
       WHERE id = ? AND company_id = ?`,
      [
        shift_start_time || null,
        shift_end_time || null,
        standard_hours || null,
        weekly_off_days || null,
        req.params.id,
        req.user.company_id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee shift updated" });
  } catch (err) {
    console.error("Error updating employee shift:", err);
    res.status(500).json({ message: "Failed to update employee shift" });
  }
});

// Toggle employee status (Deactivate / Activate)
router.put("/:id/status", auth, roles("ADMIN"), async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const [result] = await pool.query(
      "UPDATE employees SET status = ? WHERE id = ? AND company_id = ?",
      [status, req.params.id, req.user.company_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json({ message: `Employee status updated to ${status}` });
  } catch (err) {
    console.error("Error updating employee status:", err);
    res.status(500).json({ message: "Failed to update employee status" });
  }
});

// Delete employee permanently
router.delete("/:id", auth, roles("ADMIN"), async (req, res) => {
  try {
    // First delete attendance records to prevent Foreign Key constraint error
    await pool.query("DELETE FROM punch_logs WHERE employee_id = ?", [req.params.id]);
    await pool.query("DELETE FROM attendance WHERE employee_id = ?", [req.params.id]);
    
    // Then delete the employee
    const [result] = await pool.query("DELETE FROM employees WHERE id = ? AND company_id = ?", [
      req.params.id, 
      req.user.company_id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json({ message: "Employee and their attendance records deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ message: "Failed to delete employee" });
  }
});

// Admin resets employee password
router.put("/:id/reset-password", auth, roles("ADMIN"), async (req, res) => {
  try {
    const newPassword = Math.random().toString(36).slice(-8); // Generate random 8 char password
    const hash = await bcrypt.hash(newPassword, 10);
    
    const [result] = await pool.query(
      "UPDATE employees SET password_hash = ? WHERE id = ? AND company_id = ?",
      [hash, req.params.id, req.user.company_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json({ message: "Password reset successful", newPassword });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// Update company name
router.put("/company", auth, roles("ADMIN"), async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ message: "Company name is required" });
    }
    await pool.query(
      "UPDATE companies SET name = ? WHERE id = ?",
      [companyName, req.user.company_id]
    );
    res.json({ message: "Company name updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update company geofence settings
router.put("/company/geofence", auth, roles("ADMIN"), async (req, res) => {
  try {
    const { office_lat, office_lng, geofence_radius } = req.body;
    const lat = Number(office_lat);
    const lng = Number(office_lng);
    const radius = Number(geofence_radius);

    if (!Number.isFinite(lat) || Math.abs(lat) > 90) {
      return res.status(400).json({ message: "Valid office latitude is required." });
    }
    if (!Number.isFinite(lng) || Math.abs(lng) > 180) {
      return res.status(400).json({ message: "Valid office longitude is required." });
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      return res.status(400).json({ message: "Valid geofence radius is required." });
    }

    const [rows] = await pool.query("SELECT settings FROM companies WHERE id = ?", [req.user.company_id]);
    let settings = {};
    if (rows.length > 0) {
      try { settings = JSON.parse(rows[0].settings || "{}"); } catch(e){}
    }
    settings.office_lat = lat;
    settings.office_lng = lng;
    settings.geofence_radius = Math.round(radius);

    await pool.query("UPDATE companies SET settings = ? WHERE id = ?", [JSON.stringify(settings), req.user.company_id]);
    res.json({ message: "Geofence settings updated successfully", settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
