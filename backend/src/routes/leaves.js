const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

let leaveColumnsReady = false;

async function ensureLeaveColumns() {
  if (leaveColumnsReady) return;
  let dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
  if (!dbName) {
    const [dbRows] = await pool.query("SELECT DATABASE() AS db_name");
    dbName = dbRows[0]?.db_name;
  }
  const required = {
    request_type: "ALTER TABLE leaves ADD COLUMN request_type VARCHAR(30) DEFAULT 'FULL_DAY'",
    start_time: "ALTER TABLE leaves ADD COLUMN start_time TIME DEFAULT NULL",
    end_time: "ALTER TABLE leaves ADD COLUMN end_time TIME DEFAULT NULL",
    duration_minutes: "ALTER TABLE leaves ADD COLUMN duration_minutes INT DEFAULT 0",
    is_company_work: "ALTER TABLE leaves ADD COLUMN is_company_work BOOLEAN DEFAULT FALSE"
  };

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leaves'`,
    [dbName]
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  for (const [column, sql] of Object.entries(required)) {
    if (!existing.has(column)) {
      await pool.query(sql);
    }
  }
  leaveColumnsReady = true;
}

// Get all leaves for a company (Admin view)
router.get("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    await ensureLeaveColumns();
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
    await ensureLeaveColumns();
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
    await ensureLeaveColumns();
    const { start_date, end_date, leave_type, reason, request_type, start_time, end_time, is_company_work } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Dates are required" });
    }

    const normalizedType = ['FULL_DAY', 'HALF_DAY', 'SHORT_LEAVE'].includes(request_type) ? request_type : 'FULL_DAY';
    let durationMinutes = 0;
    if (start_time && end_time && /^\d{2}:\d{2}$/.test(start_time) && /^\d{2}:\d{2}$/.test(end_time)) {
      const [sh, sm] = start_time.split(":").map(Number);
      const [eh, em] = end_time.split(":").map(Number);
      durationMinutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }
    if (normalizedType === 'HALF_DAY' && durationMinutes === 0) {
      durationMinutes = 240;
    }

    await pool.query(
      `INSERT INTO leaves
       (employee_id, start_date, end_date, leave_type, reason, request_type, start_time, end_time, duration_minutes, is_company_work)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.employee_id,
        start_date,
        end_date,
        leave_type || (normalizedType === 'SHORT_LEAVE' ? 'Short Leave' : normalizedType === 'HALF_DAY' ? 'Half Day' : 'Annual Leave'),
        reason,
        normalizedType,
        start_time || null,
        end_time || null,
        durationMinutes,
        is_company_work ? 1 : 0
      ]
    );
    res.status(201).json({ message: "Leave request submitted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update leave status (Admin)
router.put("/:id/status", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    await ensureLeaveColumns();
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
