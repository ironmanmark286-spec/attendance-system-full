const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

// Get all leaves for a company (Admin view)
router.get("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, e.name, e.emp_code, e.designation
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE e.company_id = ?
      ORDER BY l.created_at DESC
    `, [req.user.company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get leaves for logged-in employee (Mobile view)
router.get("/me", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC",
      [req.user.employee_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Apply for leave (Employee)
router.post("/apply", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { start_date, end_date, leave_type, reason } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Dates are required" });
    }

    await pool.query(
      "INSERT INTO leaves (employee_id, start_date, end_date, leave_type, reason) VALUES (?, ?, ?, ?, ?)",
      [req.user.employee_id, start_date, end_date, leave_type || 'Annual Leave', reason]
    );
    res.status(201).json({ message: "Leave request submitted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update leave status (Admin)
router.put("/:id/status", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Ensure the leave belongs to an employee in the admin's company
    const [leaveRows] = await pool.query(`
      SELECT l.id FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.id = ? AND e.company_id = ?
    `, [req.params.id, req.user.company_id]);

    if (!leaveRows.length) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    await pool.query("UPDATE leaves SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: `Leave request ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;