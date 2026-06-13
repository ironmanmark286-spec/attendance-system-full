const express = require("express");
const { Parser } = require("json2csv");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

const IST_OFFSET_MINUTES = 330;

const getBusinessDate = (date = new Date()) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return istDate.toISOString().slice(0, 10);
};

const getBusinessHour = (date = new Date()) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return { hour: istDate.getUTCHours(), minute: istDate.getUTCMinutes() };
};

const timeToMinutes = (timeValue, fallback = "09:00:00") => {
  const time = String(timeValue || fallback);
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 540;
  return hours * 60 + minutes;
};

const calculateTotalSeconds = (logs, until = null) => {
  let totalSeconds = 0;
  let lastIn = null;
  for (const log of logs) {
    if (log.punch_type === 'IN') {
      lastIn = new Date(log.punch_time);
    } else if (log.punch_type === 'OUT' && lastIn) {
      const outTime = new Date(log.punch_time);
      totalSeconds += Math.max(0, Math.floor((outTime - lastIn) / 1000));
      lastIn = null;
    }
  }
  if (until && lastIn) {
    totalSeconds += Math.max(0, Math.floor((until - lastIn) / 1000));
  }
  return totalSeconds;
};

const secondsToStoredMinutes = (seconds) => Math.ceil(Math.max(0, seconds) / 60);

const calculateTotalMinutes = (logs, until = null) => {
  return secondsToStoredMinutes(calculateTotalSeconds(logs, until));
};

const calculateAwaySeconds = (logs) => {
  return logs.reduce((away, log, index) => {
    const nextLog = logs[index + 1];
    if (log.punch_type === 'OUT' && nextLog?.punch_type === 'IN') {
      return away + Math.max(0, Math.floor((new Date(nextLog.punch_time) - new Date(log.punch_time)) / 1000));
    }
    return away;
  }, 0);
};

const getAttendanceRuntime = (logs, now = new Date()) => {
  const lastLog = logs.length ? logs[logs.length - 1] : null;
  const lastPunch = lastLog?.punch_type || null;
  const totalSeconds = calculateTotalSeconds(logs, lastPunch === 'IN' ? now : null);
  const totalMinutes = secondsToStoredMinutes(totalSeconds);
  const currentSessionSeconds = lastPunch === 'IN'
    ? Math.max(0, Math.floor((now - new Date(lastLog.punch_time)) / 1000))
    : 0;
  return { lastPunch, totalMinutes, totalSeconds, currentSessionMinutes: secondsToStoredMinutes(currentSessionSeconds), currentSessionSeconds };
};

const getOtSettings = async (companyId) => {
  const settings = {
    standardWorkHours: 9,
    otApplicableFromMinutes: 540,
    maxDailyOTMinutes: 180
  };
  const [otRows] = await pool.query(
    "SELECT standard_hours, ot_applicable_from_minutes, max_daily_ot_minutes FROM ot_settings WHERE company_id = ?",
    [companyId]
  );
  if (otRows.length > 0) {
    settings.standardWorkHours = Number(otRows[0].standard_hours) || 9;
    settings.otApplicableFromMinutes = Number(otRows[0].ot_applicable_from_minutes) || 540;
    settings.maxDailyOTMinutes = Number(otRows[0].max_daily_ot_minutes) || 180;
  }
  return settings;
};

const calculateOvertimeMinutes = (totalSeconds, otSettings) => {
  const standardSeconds = Math.floor((otSettings.standardWorkHours || 9) * 3600);
  const applicableFromSeconds = Math.max(0, Number(otSettings.otApplicableFromMinutes || 540) * 60);
  const maxDailyOTMinutes = Number(otSettings.maxDailyOTMinutes || 180);
  if (totalSeconds < applicableFromSeconds) return 0;

  const overtimeSeconds = Math.max(0, totalSeconds - standardSeconds);
  let overtimeMinutes = secondsToStoredMinutes(overtimeSeconds);
  if (maxDailyOTMinutes > 0 && overtimeMinutes > maxDailyOTMinutes) {
    overtimeMinutes = maxDailyOTMinutes;
  }
  return overtimeMinutes;
};

const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCompanyGeofence = async (companyId) => {
  const [rows] = await pool.query("SELECT settings FROM companies WHERE id = ?", [companyId]);
  if (!rows.length) return null;
  let settings = {};
  try { settings = JSON.parse(rows[0].settings || "{}"); } catch (e) {}
  const officeLat = Number(settings.office_lat);
  const officeLng = Number(settings.office_lng);
  const radius = Number(settings.geofence_radius) || 50;
  if (!Number.isFinite(officeLat) || !Number.isFinite(officeLng) || !Number.isFinite(radius) || radius <= 0) {
    return null;
  }
  return { officeLat, officeLng, radius };
};

const validateServerGeofence = async ({ companyId, latitude, longitude, accuracy, punchType }) => {
  const geofence = await getCompanyGeofence(companyId);
  if (!geofence) return { ok: true, geofence: null };

  const lat = Number(latitude);
  const lng = Number(longitude);
  const acc = Math.max(0, Number(accuracy) || 0);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      geofence,
      message: "🔴 Live Tracking Active: Turn on GPS to verify you are strictly inside the company bounds."
    };
  }

  const distance = getDistanceFromLatLonInMeters(lat, lng, geofence.officeLat, geofence.officeLng);
  const effectiveDistance = Math.max(0, distance - Math.min(acc, 20));
  if (punchType === 'IN' && effectiveDistance > geofence.radius) {
    return {
      ok: false,
      geofence,
      distance,
      accuracy: acc,
      message: `🔴 Strict Geofence Blocked: You are ${Math.round(distance)}m away. You must be strictly within ${geofence.radius}m of the office to check in!`
    };
  }

  return { ok: true, geofence, distance, accuracy: acc, effectiveDistance };
};

let attendanceAuditReady = false;

async function ensureAttendanceAuditTable() {
  if (attendanceAuditReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attendance_id INT NOT NULL,
      corrected_by INT NOT NULL,
      old_check_in DATETIME DEFAULT NULL,
      old_check_out DATETIME DEFAULT NULL,
      old_status VARCHAR(30) DEFAULT NULL,
      old_total_minutes INT DEFAULT 0,
      new_check_in DATETIME DEFAULT NULL,
      new_check_out DATETIME DEFAULT NULL,
      new_status VARCHAR(30) DEFAULT NULL,
      new_total_minutes INT DEFAULT 0,
      reason TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
      FOREIGN KEY (corrected_by) REFERENCES users(id)
    )
  `);
  attendanceAuditReady = true;
}

async function findActiveAttendance(employeeId, preferredDate) {
  const [rows] = await pool.query(
    `SELECT a.*,
      (SELECT punch_type FROM punch_logs WHERE attendance_id = a.id ORDER BY punch_time DESC LIMIT 1) AS last_punch
     FROM attendance a
     WHERE a.employee_id = ?
       AND (a.att_date = ? OR a.check_out IS NULL OR a.check_in >= DATE_SUB(NOW(), INTERVAL 36 HOUR))
     ORDER BY a.check_in DESC
     LIMIT 5`,
    [employeeId, preferredDate]
  );

  return rows.find((row) => row.last_punch === 'IN') || null;
}

router.post("/check-in", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { location, latitude, longitude, accuracy } = req.body;
    const employeeId = req.user.employee_id;
    const now = new Date();
    const dateStr = getBusinessDate(now);

    const companyId = req.user.company_id;
    const [compRows] = await pool.query("SELECT name FROM companies WHERE id = ?", [companyId]);
    const companyName = compRows.length ? compRows[0].name : "Workspace";

    const geofenceCheck = await validateServerGeofence({ companyId, latitude, longitude, accuracy, punchType: 'IN' });
    if (!geofenceCheck.ok) {
      return res.status(400).json({ message: geofenceCheck.message, distance: geofenceCheck.distance, accuracy: geofenceCheck.accuracy });
    }

    const { hour, minute } = getBusinessHour(now);
    let shiftStartMinutes = 540;
    let lateGraceMinutes = 0;
    try {
      const [shiftRows] = await pool.query(
        "SELECT shift_start_time, late_grace_minutes FROM ot_settings WHERE company_id = ?",
        [companyId]
      );
      if (shiftRows.length) {
        shiftStartMinutes = timeToMinutes(shiftRows[0].shift_start_time, "09:00:00");
        lateGraceMinutes = Number(shiftRows[0].late_grace_minutes) || 0;
      }
    } catch (e) {
      console.warn("Shift settings unavailable, using defaults:", e.message);
    }

    const isLate = (hour * 60 + minute) > (shiftStartMinutes + lateGraceMinutes);
    const status = isLate ? 'LATE' : 'PRESENT';

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
    const { location, latitude, longitude, accuracy } = req.body;
    const employeeId = req.user.employee_id;
    const now = new Date();
    const dateStr = getBusinessDate(now);

    const companyId = req.user.company_id;
    const [compRows] = await pool.query("SELECT name FROM companies WHERE id = ?", [companyId]);
    const companyName = compRows.length ? compRows[0].name : "Workspace";
    await validateServerGeofence({ companyId, latitude, longitude, accuracy, punchType: 'OUT' });

    const activeAttendance = await findActiveAttendance(employeeId, dateStr);
    if (!activeAttendance) {
      return res.status(400).json({ message: "Check-in not found" });
    }
    const attId = activeAttendance.id;

    await pool.query(
      "INSERT INTO punch_logs (employee_id, attendance_id, punch_time, punch_type) VALUES (?, ?, ?, 'OUT')",
      [employeeId, attId, now]
    );

    const [logs] = await pool.query(
      "SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC",
      [attId]
    );

    const runtime = getAttendanceRuntime(logs, now);
    const totalMinutes = runtime.totalMinutes;

    const overtimeMinutes = calculateOvertimeMinutes(runtime.totalSeconds, await getOtSettings(companyId));

    await pool.query(
      "UPDATE attendance SET check_out = ?, total_minutes = ?, overtime_minutes = ?, check_out_location = ? WHERE id = ?",
      [now, totalMinutes, overtimeMinutes, location || 'Unknown', attId]
    );

    return res.json({ message: "Check-out successful", totalMinutes, totalSeconds: runtime.totalSeconds, companyName });
  } catch (err) {
    console.error("Check-out error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/heartbeat", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const employeeId = req.user.employee_id;
    const companyId = req.user.company_id;
    const now = new Date();
    const dateStr = getBusinessDate(now);

    const activeAttendance = await findActiveAttendance(employeeId, dateStr);
    if (!activeAttendance) {
      return res.json({ status: "not_punched_in" });
    }

    const geofence = await getCompanyGeofence(companyId);
    if (!geofence) return res.json({ status: "ok", message: "No geofence set" });

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ message: "Invalid coords" });

    const distance = getDistanceFromLatLonInMeters(lat, lng, geofence.officeLat, geofence.officeLng);
    const acc = Math.max(0, Number(accuracy) || 0);
    const effectiveDistance = Math.max(0, distance - Math.min(acc, 20));

    if (effectiveDistance > geofence.radius) {
      const attId = activeAttendance.id;
      await pool.query(
        "INSERT INTO punch_logs (employee_id, attendance_id, punch_time, punch_type, location) VALUES (?, ?, ?, 'OUT', ?)",
        [employeeId, attId, now, `🚨 LIVE TRACKER AUTO-CHECKOUT: Employee left the strict ${geofence.radius}m zone (${Math.round(distance)}m away)`]
      );
      const [logs] = await pool.query("SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC", [attId]);
      const runtime = getAttendanceRuntime(logs, now);
      const totalMinutes = runtime.totalMinutes;
      const overtimeMinutes = calculateOvertimeMinutes(runtime.totalSeconds, await getOtSettings(companyId));
      await pool.query("UPDATE attendance SET check_out = ?, total_minutes = ?, overtime_minutes = ?, check_out_location = ? WHERE id = ?", [now, totalMinutes, overtimeMinutes, `🚨 Auto-checkout: Left ${geofence.radius}m perimeter`, attId]);
      return res.status(403).json({ status: "auto_checked_out", totalMinutes, totalSeconds: runtime.totalSeconds, message: `Auto checked out due to leaving the ${geofence.radius}m zone.` });
    }
    return res.json({ status: "ok", distance: effectiveDistance });
  } catch (err) {
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
      for (const row of rows) {
        const [logs] = await pool.query(
          "SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC",
          [row.id]
        );
        const runtime = getAttendanceRuntime(logs, now);
        row.total_minutes = runtime.totalMinutes;
        row.total_seconds = runtime.totalSeconds;
        row.current_session_minutes = runtime.currentSessionMinutes;
        row.current_session_seconds = runtime.currentSessionSeconds;
        row.is_punched_in = runtime.lastPunch === 'IN';
      }
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
    const dateStr = getBusinessDate();
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
    const dateStr = getBusinessDate();
    const [rows] = await pool.query(
      `SELECT a.*, e.emp_code, e.name
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.att_date = ? AND e.company_id = ?
       ORDER BY a.check_in DESC`,
      [dateStr, req.user.company_id]
    );
    
    const now = new Date();
    for (let r of rows) {
      const [logs] = await pool.query("SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC", [r.id]);
      r.punches = logs;
      const runtime = getAttendanceRuntime(logs, now);
      const awaySeconds = calculateAwaySeconds(logs);
      r.total_minutes = runtime.totalMinutes;
      r.total_seconds = runtime.totalSeconds;
      r.current_session_minutes = runtime.currentSessionMinutes;
      r.current_session_seconds = runtime.currentSessionSeconds;
      r.live_status = runtime.lastPunch === 'IN' ? 'ACTIVE' : (runtime.lastPunch === 'OUT' ? 'CHECKED OUT' : 'UNKNOWN');
      r.away_minutes = secondsToStoredMinutes(awaySeconds);
      r.away_seconds = awaySeconds;
    }

    return res.json(rows);
  } catch (err) {
    console.error("Today attendance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/logs/monthly", auth, roleGuard("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month is required in YYYY-MM format" });
    }

    const startDate = `${month}-01`;
    const [endRows] = await pool.query("SELECT LAST_DAY(?) AS last_day", [startDate]);
    const endDate = endRows[0].last_day;

    const [rows] = await pool.query(
      `SELECT a.*, e.emp_code, e.name
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.att_date BETWEEN ? AND ? AND e.company_id = ?
       ORDER BY a.att_date DESC, a.check_in DESC`,
      [startDate, endDate, req.user.company_id]
    );

    const now = new Date();
    for (let r of rows) {
      const [logs] = await pool.query("SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC", [r.id]);
      const runtime = getAttendanceRuntime(logs, now);
      r.punches = logs;
      r.total_minutes = runtime.totalMinutes;
      r.total_seconds = runtime.totalSeconds;
      r.current_session_minutes = runtime.currentSessionMinutes;
      r.current_session_seconds = runtime.currentSessionSeconds;
      r.live_status = runtime.lastPunch === 'IN' ? 'ACTIVE' : (runtime.lastPunch === 'OUT' ? 'CHECKED OUT' : 'UNKNOWN');
      const awaySeconds = calculateAwaySeconds(logs);
      r.away_minutes = secondsToStoredMinutes(awaySeconds);
      r.away_seconds = awaySeconds;
    }

    return res.json(rows);
  } catch (err) {
    console.error("Monthly attendance logs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/correct", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    await ensureAttendanceAuditTable();
    const { check_in, check_out, status, reason } = req.body;
    if (!reason || String(reason).trim().length < 3) {
      return res.status(400).json({ message: "Correction reason is required" });
    }

    const [rows] = await pool.query(
      `SELECT a.id, a.employee_id, a.check_in, a.check_out, a.status, a.total_minutes
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.id = ? AND e.company_id = ?`,
      [req.params.id, req.user.company_id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const oldRecord = rows[0];
    const updates = [];
    const values = [];
    if (check_in) {
      updates.push("check_in = ?");
      values.push(new Date(check_in));
    }
    if (check_out) {
      updates.push("check_out = ?");
      values.push(new Date(check_out));
    }
    if (['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'].includes(status)) {
      updates.push("status = ?");
      values.push(status);
    }

    let totalMinutes = null;
    if (check_in && check_out) {
      totalMinutes = secondsToStoredMinutes(Math.max(0, Math.floor((new Date(check_out) - new Date(check_in)) / 1000)));
      updates.push("total_minutes = ?");
      values.push(totalMinutes);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No correction fields provided" });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE attendance SET ${updates.join(", ")} WHERE id = ?`, values);

    const [newRows] = await pool.query(
      "SELECT check_in, check_out, status, total_minutes FROM attendance WHERE id = ?",
      [req.params.id]
    );
    const newRecord = newRows[0];
    await pool.query(
      `INSERT INTO attendance_corrections
       (attendance_id, corrected_by, old_check_in, old_check_out, old_status, old_total_minutes,
        new_check_in, new_check_out, new_status, new_total_minutes, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        req.user.id,
        oldRecord.check_in,
        oldRecord.check_out,
        oldRecord.status,
        oldRecord.total_minutes || 0,
        newRecord.check_in,
        newRecord.check_out,
        newRecord.status,
        newRecord.total_minutes || 0,
        reason
      ]
    );

    res.json({ message: "Attendance corrected", totalMinutes });
  } catch (err) {
    console.error("Attendance correction error:", err);
    res.status(500).json({ message: "Failed to correct attendance" });
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
      `SELECT a.id, e.emp_code, e.name, a.att_date, a.check_in, a.check_out, a.total_minutes, a.overtime_minutes, a.status, a.check_in_location, a.check_out_location
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.att_date BETWEEN ? AND ? AND e.company_id = ?
       ORDER BY e.emp_code, a.att_date`,
      [startDate, endDate, req.user.company_id]
    );

    const now = new Date();
    for (let row of rows) {
      const [logs] = await pool.query(
        "SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC",
        [row.id]
      );
      if (logs.length) {
        row.total_minutes = getAttendanceRuntime(logs, now).totalMinutes;
      }
      delete row.id;
    }

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

    const [employees] = await pool.query(
      `SELECT id, emp_code, name
       FROM employees
       WHERE company_id = ? AND status = 'ACTIVE'
       ORDER BY name`,
      [req.user.company_id]
    );

    const [attendanceRows] = await pool.query(
      `SELECT a.id, a.employee_id, a.status, a.overtime_minutes
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.att_date BETWEEN ? AND ? AND e.company_id = ?`,
      [startDate, endDate, req.user.company_id]
    );

    const now = new Date();
    const byEmployee = new Map(employees.map((employee) => [employee.id, {
      ...employee,
      total_present: 0,
      total_late: 0,
      total_minutes: 0,
      total_seconds: 0,
      total_overtime: 0,
      has_active_session: false
    }]));

    for (const row of attendanceRows) {
      const summary = byEmployee.get(row.employee_id);
      if (!summary) continue;

      if (['PRESENT', 'LATE', 'HALF_DAY'].includes(row.status)) summary.total_present += 1;
      if (row.status === 'LATE') summary.total_late += 1;

      const [logs] = await pool.query(
        "SELECT punch_time, punch_type FROM punch_logs WHERE attendance_id = ? ORDER BY punch_time ASC",
        [row.id]
      );
      const runtime = getAttendanceRuntime(logs, now);
      summary.total_minutes += runtime.totalMinutes;
      summary.total_seconds += runtime.totalSeconds;
      summary.total_overtime += Number(row.overtime_minutes) || 0;
      if (runtime.lastPunch === 'IN') summary.has_active_session = true;
    }

    return res.json([...byEmployee.values()]);
  } catch (err) {
    console.error("Monthly summary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// NEW: Get online team members for mobile app
router.get("/online-team", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const dateStr = getBusinessDate();
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
