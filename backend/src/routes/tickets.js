const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

// 1. Employee creates a new ticket
router.post("/", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO tickets (company_id, employee_id, title, description, priority) VALUES (?, ?, ?, ?, ?)",
      [req.user.company_id, req.user.employee_id, title, description, priority || "Medium"]
    );

    res.status(201).json({ 
      message: "Ticket created successfully.", 
      ticketId: result.insertId 
    });
  } catch (err) {
    console.error("Ticket creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Employee gets their own tickets
router.get("/me", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tickets WHERE employee_id = ? AND company_id = ? ORDER BY created_at DESC",
      [req.user.employee_id, req.user.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch tickets error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Admin gets all tickets for the company
router.get("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, e.name as employee_name, e.emp_code
      FROM tickets t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.company_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.company_id]);
    res.json(rows);
  } catch (err) {
    console.error("Admin fetch tickets error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. Admin updates ticket status
router.put("/:id/status", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const [result] = await pool.query(
      "UPDATE tickets SET status = ? WHERE id = ? AND company_id = ?",
      [status, req.params.id, req.user.company_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ticket not found or unauthorized." });
    }

    res.json({ message: "Ticket status updated successfully." });
  } catch (err) {
    console.error("Update ticket status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;