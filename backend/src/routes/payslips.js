const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payslip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDFs and images are allowed"));
    }
  }
});

// Admin uploads a payslip
router.post("/upload", auth, roleGuard("ADMIN", "HR"), upload.single("file"), async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;
    
    if (!employee_id || !month || !year || !req.file) {
      return res.status(400).json({ message: "Employee, month, year, and file are required." });
    }

    // Verify employee belongs to admin's company
    const [emp] = await pool.query("SELECT id FROM employees WHERE id = ? AND company_id = ?", [employee_id, req.user.company_id]);
    if (!emp.length) {
      return res.status(403).json({ message: "Invalid employee." });
    }

    const filePath = "/uploads/" + req.file.filename;

    await pool.query(
      "INSERT INTO payslips (company_id, employee_id, month, year, file_path) VALUES (?, ?, ?, ?, ?)",
      [req.user.company_id, employee_id, month, year, filePath]
    );

    res.status(201).json({ message: "Payslip uploaded successfully", filePath });
  } catch (err) {
    console.error("Payslip upload error:", err);
    res.status(500).json({ message: "Server error during upload: " + (err.message || err) });
  }
});

// Admin gets all payslips for the company
router.get("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, e.name as employee_name, e.emp_code
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.company_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Employee gets their own payslips
router.get("/me", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM payslips
      WHERE employee_id = ? AND company_id = ?
      ORDER BY created_at DESC
    `, [req.user.employee_id, req.user.company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin deletes a payslip
router.delete("/:id", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    // get file path to delete from disk
    const [rows] = await pool.query("SELECT file_path FROM payslips WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
    if (rows.length > 0) {
      const filePath = path.join(__dirname, "../../", rows[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await pool.query("DELETE FROM payslips WHERE id = ?", [req.params.id]);
    }
    res.json({ message: "Payslip deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;