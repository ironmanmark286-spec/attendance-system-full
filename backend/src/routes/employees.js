const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

const router = express.Router();

// Current logged-in employee profile (mobile app)
router.get("/me", auth, async (req, res) => {
  try {
    if (req.user.role !== "EMPLOYEE") {
      return res.status(403).json({ message: "Employees only" });
    }
    const empId = req.user.employee_id || req.user.id;
    const [rows] = await pool.query(
      "SELECT emp_code, name, designation, status, created_at FROM employees WHERE id = ? AND company_id = ?",
      [empId, req.user.company_id]
    );
    if (!rows.length) return res.status(404).json({ message: "Employee not found" });
    const e = rows[0];
    res.json({
      name: e.name,
      emp_code: e.emp_code,
      designation: e.designation || "Employee",
      department: e.designation || "General",
      status: e.status,
      created_at: e.created_at
    });
  } catch (err) {
    console.error("Error fetching employee profile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get employees for the company
router.get("/", auth, roles("ADMIN"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, emp_code, name, status, designation, created_at FROM employees WHERE company_id = ? ORDER BY created_at DESC",
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
    const { empCode, name, password, designation } = req.body;
    if (!empCode || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
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
      "INSERT INTO employees (company_id, emp_code, name, designation, password_hash) VALUES (?, ?, ?, ?, ?)",
      [req.user.company_id, empCode, name, designation || 'Employee', hash]
    );

    res.status(201).json({ message: "Employee added successfully", empCode, name, designation: designation || 'Employee' });
  } catch (err) {
    console.error("Error adding employee:", err);
    res.status(500).json({ message: "Failed to add employee" });
  }
});

// Generate 100 Fake Employees for Testing
router.post("/generate-bulk", auth, roles("ADMIN"), async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const bulkPass = "Test@123";
    const hash = await bcrypt.hash(bulkPass, 10);
    const values = [];
    for (let i = 1; i <= 100; i++) {
      const code = `TEST-${Math.floor(Math.random() * 10000)}-${i}`;
      values.push([companyId, code, `Test Employee ${i}`, 'Quality Tester', hash]);
    }
    await pool.query(
      "INSERT IGNORE INTO employees (company_id, emp_code, name, designation, password_hash) VALUES ?",
      [values]
    );
    res.json({ message: "100 Fake employees generated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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

module.exports = router;