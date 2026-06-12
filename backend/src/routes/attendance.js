const express = require("express");
const { Parser } = require("json2csv");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

router.post("/check-in", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { location } = req.body;
    const employeeId = req.user.employee_id;
    const now = new Date();
    
    // Using local date string to avoid timezone bugs
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
    const status = isLate ? 'LATE' : 'PRESENT';

    const companyId = req.user.company_id;
    const [compRows] = await pool.query("SELECT name FROM companies WHERE id = ?", [companyId]);
    const companyName = compRows.length ? compRows[0].name : "Workspace";

    const [rows] = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = ? AND att_date = ?",
      [employeeId, dateStr]
    );

    let attId;
    if (!rows.length) {
      const [result] = await pool.query(
        "INSERT INTO attendance (employee_id, att_date, check_in, status, check_in_location) VALUES (?, ?, ?, ?, ?)",
        [employeeId, dateStr, now, status, location || 'Unknown']
      );
      attId = result.insertId;
    } else {
      attId = rows[0].id;
      const [lastLogs] = await pool.query(
        "SELECT punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time DESC LIMIT 1",
        [attId]
      );
      if (lastLogs.length && lastLogs[0].punch_type === 'IN') {
        return res.status(400).json({ message: "Already checked in. Please check out first." });
      }
    }

    await pool.query(
      "INSERT INTO punch_logs (employee_id, attendance_id, punch_time, punch_type, location) VALUES (?, ?, ?, 'IN', ?)",
      [employeeId, attId, now, location || 'Unknown']
    );

    return res.json({ message: "Check-in successful", companyName });
  } catch (err) {
    console.error("Check-in error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/check-out", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { location } = req.body;
    const employeeId = req.user.employee_id;
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    const companyId = req.user.company_id;
    const [compRows] = await pool.query("SELECT name FROM companies WHERE id = ?", [companyId]);
    const companyName = compRows.length ? compRows[0].name : "Workspace";

    const [rows] = await pool.query(
      "SELECT * FROM attendance WHERE employee_id = ? AND att_date = ?",
      [employeeId, dateStr]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Check-in not found" });
    }
    const attId = rows[0].id;

    const [lastLogs] = await pool.query(
      "SELECT punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time DESC LIMIT 1",
      [attId]
    );
    if (!lastLogs.length || lastLogs[0].punch_type === 'OUT') {
      return res.status(400).json({ message: "Already checked out or no active check-in found." });
    }

    await pool.query(
      "INSERT INTO punch_logs (employee_id, attendance_id, punch_time, punch_type, location) VALUES (?, ?, ?, 'OUT', ?)",
      [employeeId, attId, now, location || 'Unknown']
    );

    const [logs] = await pool.query(
      "SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC",
      [attId]
    );

    let totalMinutes = 0;
    let lastIn = null;
    for (let log of logs) {
      if (log.punch_type === 'IN') {
        lastIn = new Date(log.punch_time);
      } else if (log.punch_type === 'OUT' && lastIn) {
        const outTime = new Date(log.punch_time);
        totalMinutes += Math.floor((outTime - lastIn) / 60000);
        lastIn = null;
      }
    }

    let standardWorkHours = 9;
    let otApplicableFrom = 540;
    let maxDailyOT = 180;

    const [otRows] = await pool.query("SELECT standard_hours, ot_applicable_from_minutes, max_daily_ot_minutes FROM ot_settings WHERE company_id = ?", [companyId]);
    if (otRows.length > 0) {
      standardWorkHours = Number(otRows[0].standard_hours) || 9;
      otApplicableFrom = Number(otRows[0].ot_applicable_from_minutes) || 540;
      maxDailyOT = Number(otRows[0].max_daily_ot_minutes) || 180;
    }

    let overtimeMinutes = 0;
    if (totalMinutes >= otApplicableFrom) {
      overtimeMinutes = totalMinutes - Math.floor(standardWorkHours * 60);
      if (maxDailyOT > 0 && overtimeMinutes > maxDailyOT) {
        overtimeMinutes = maxDailyOT;
      }
      if (overtimeMinutes < 0) overtimeMinutes = 0;
    }

    await pool.query(
      "UPDATE attendance SET check_out = ?, total_minutes = ?, overtime_minutes = ?, check_out_location = ? WHERE id = ?",
      [now, totalMinutes, overtimeMinutes, location || 'Unknown', attId]
    );

    return res.json({ message: "Check-out successful", totalMinutes, companyName });
  } catch (err) {
    console.error("Check-out error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// NEW: Get history for logged-in employee (Frappe style timeline)
router.get("/history", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const [rows] = await pool.query(
      `SELECT id, att_date, check_in, check_out, total_minutes, overtime_minutes, status, check_in_location, check_out_location,
       (SELECT punch_type FROM punch_logs WHERE attendance_id = attendance.id ORDER BY punch_time DESC LIMIT 1) AS last_punch
       FROM attendance 
       WHERE employee_id = ? 
       ORDER BY att_date DESC LIMIT 30`,
      [employeeId]
    );

    if (rows.length > 0) {
      const now = new Date();
      const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      
      // A punch is active if the last log is 'IN' and it's the most recent attendance record
      // We use the last_punch retrieved directly via SQL to prevent JS timezone parsing bugs
      rows[0].is_punched_in = rows[0].last_punch === 'IN';
    }

    return res.json(rows);
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// NEW: Get analytics for the admin dashboard
router.get("/stats/today", auth, roleGuard("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const companyId = req.user.company_id;

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM employees WHERE company_id = ? AND status = 'ACTIVE'", [companyId]);
    const [[{ present }]] = await pool.query(`
      SELECT COUNT(*) as present FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.att_date = ? AND a.status IN ('PRESENT', 'LATE') AND e.company_id = ?
    `, [dateStr, companyId]);
    const [[{ late }]] = await pool.query(`
      SELECT COUNT(*) as late FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.att_date = ? AND a.status = 'LATE' AND e.company_id = ?
    `, [dateStr, companyId]);
    
    // Fetch Company and Admin Details
    const [compRows] = await pool.query("SELECT name, company_code, subscription_status, trial_ends_at, subscription_ends_at FROM companies WHERE id = ?", [companyId]);
    
    if (compRows.length) {
      const comp = compRows[0];
      const now = new Date();
      let isExpired = comp.subscription_status === 'EXPIRED';
      if (comp.subscription_status === 'TRIAL' && comp.trial_ends_at && new Date(comp.trial_ends_at) < now) isExpired = true;
      if (comp.subscription_status === 'ACTIVE' && comp.subscription_ends_at && new Date(comp.subscription_ends_at) < now) isExpired = true;
      
      if (isExpired) {
        if (comp.subscription_status !== 'EXPIRED') await pool.query("UPDATE companies SET subscription_status = 'EXPIRED' WHERE id = ?", [companyId]);
        return res.status(402).json({ message: "Subscription expired" });
      }
    }
    
    const companyName = compRows.length ? compRows[0].name : "Workspace";
    const companyCode = compRows.length ? compRows[0].company_code : "";

    const [userRows] = await pool.query("SELECT username FROM users WHERE id = ?", [req.user.id]);
    const adminName = userRows.length ? userRows[0].username : "Admin";

    const stats = { total, present, late, absent: Math.max(0, total - present), companyName, companyCode, adminName };
    return res.json(stats);
  } catch (err) {
    console.error("Stats today error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/today", auth, roleGuard("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
      `SELECT a.*, e.emp_code, e.name
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.att_date = ? AND e.company_id = ?
       ORDER BY a.check_in DESC`,
      [dateStr, req.user.company_id]
    );
    
    for (let r of rows) {
      const [logs] = await pool.query("SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC", [r.id]);
      r.punches = logs;
    }

    return res.json(rows);
  } catch (err) {
    console.error("Today attendance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/report/monthly", auth, roleGuard("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month is required in YYYY-MM format" });
    }

    const startDate = `${month}-01`;
    const [endRows] = await pool.query("SELECT LAST_DAY(?) AS last_day", [startDate]);
    const endDate = endRows[0].last_day;

    const [rows] = await pool.query(
      `SELECT e.emp_code, e.name, a.att_date, a.check_in, a.check_out, a.total_minutes, a.overtime_minutes, a.status, a.check_in_location, a.check_out_location
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.att_date BETWEEN ? AND ? AND e.company_id = ?
       ORDER BY e.emp_code, a.att_date`,
      [startDate, endDate, req.user.company_id]
    );

    const parser = new Parser({
      fields: ["emp_code", "name", "att_date", "check_in", "check_out", "total_minutes", "overtime_minutes", "status", "check_in_location", "check_out_location"]
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance_report_${month}.csv`);
    return res.send(parser.parse(rows));
  } catch (err) {
    console.error("Monthly report error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// NEW: Get Monthly Summary for HR Payroll
router.get("/summary/monthly", auth, roleGuard("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month is required in YYYY-MM format" });
    }

    const startDate = `${month}-01`;
    const [endRows] = await pool.query("SELECT LAST_DAY(?) AS last_day", [startDate]);
    const endDate = endRows[0].last_day;

    const [rows] = await pool.query(
      `SELECT e.id, e.emp_code, e.name,
        SUM(CASE WHEN a.status IN ('PRESENT', 'LATE', 'HALF_DAY') THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) as total_late,
        SUM(a.total_minutes) as total_minutes,
        SUM(a.overtime_minutes) as total_overtime
       FROM employees e
       LEFT JOIN attendance a ON e.id = a.employee_id AND a.att_date BETWEEN ? AND ?
       WHERE e.company_id = ? AND e.status = 'ACTIVE'
       GROUP BY e.id, e.emp_code, e.name
       ORDER BY e.name`,
      [startDate, endDate, req.user.company_id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Monthly summary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// NEW: Get online team members for mobile app
router.get("/online-team", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
      `SELECT e.id, e.name, e.designation as role 
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.att_date = ? AND e.company_id = ? AND e.id != ? AND a.status IN ('PRESENT', 'LATE')
       ORDER BY a.check_in DESC LIMIT 10`,
      [dateStr, req.user.company_id, req.user.employee_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Online team error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
