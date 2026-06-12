const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

let otColumnsReady = false;

async function ensureOtColumns() {
  if (otColumnsReady) return;
  let dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
  if (!dbName) {
    const [dbRows] = await pool.query("SELECT DATABASE() AS db_name");
    dbName = dbRows[0]?.db_name;
  }

  const required = {
    shift_start_time: "ALTER TABLE ot_settings ADD COLUMN shift_start_time TIME DEFAULT '09:00:00'",
    shift_end_time: "ALTER TABLE ot_settings ADD COLUMN shift_end_time TIME DEFAULT '18:00:00'",
    late_grace_minutes: "ALTER TABLE ot_settings ADD COLUMN late_grace_minutes INT DEFAULT 0"
  };

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ot_settings'`,
    [dbName]
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  for (const [column, sql] of Object.entries(required)) {
    if (!existing.has(column)) {
      await pool.query(sql);
    }
  }
  otColumnsReady = true;
}

// Get OT settings for a company
router.get("/", auth, roleGuard("ADMIN", "HR", "EMPLOYEE"), async (req, res) => {
  try {
    await ensureOtColumns();
    const companyId = req.user.company_id;
    const [rows] = await pool.query(
      "SELECT * FROM ot_settings WHERE company_id = ?",
      [companyId]
    );

    if (rows.length === 0) {
      // Return default settings if not exists
      return res.json({
        standard_hours: 9.0,
        ot_rate_multiplier: 1.5,
        ot_applicable_from_minutes: 540,
        max_daily_ot_minutes: 180,
        weekly_off_days: "Saturday,Sunday",
        ot_payment_condition: "Above standard hours",
        shift_start_time: "09:00:00",
        shift_end_time: "18:00:00",
        late_grace_minutes: 0
      });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update OT settings for a company
router.put("/", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    await ensureOtColumns();
    const {
      standard_hours,
      ot_rate_multiplier,
      ot_applicable_from_minutes,
      max_daily_ot_minutes,
      weekly_off_days,
      ot_payment_condition,
      shift_start_time,
      shift_end_time,
      late_grace_minutes
    } = req.body;
    const companyId = req.user.company_id;

    if (!standard_hours || !ot_rate_multiplier) {
      return res.status(400).json({ message: "Standard hours and OT rate are required" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM ot_settings WHERE company_id = ?",
      [companyId]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE ot_settings
         SET standard_hours = ?, ot_rate_multiplier = ?, ot_applicable_from_minutes = ?,
         max_daily_ot_minutes = ?, weekly_off_days = ?, ot_payment_condition = ?,
         shift_start_time = ?, shift_end_time = ?, late_grace_minutes = ?
         WHERE company_id = ?`,
        [
          standard_hours,
          ot_rate_multiplier,
          ot_applicable_from_minutes,
          max_daily_ot_minutes,
          weekly_off_days,
          ot_payment_condition,
          shift_start_time || "09:00",
          shift_end_time || "18:00",
          parseInt(late_grace_minutes, 10) || 0,
          companyId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO ot_settings
         (company_id, standard_hours, ot_rate_multiplier, ot_applicable_from_minutes, max_daily_ot_minutes, weekly_off_days, ot_payment_condition, shift_start_time, shift_end_time, late_grace_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyId,
          standard_hours,
          ot_rate_multiplier,
          ot_applicable_from_minutes,
          max_daily_ot_minutes,
          weekly_off_days,
          ot_payment_condition,
          shift_start_time || "09:00",
          shift_end_time || "18:00",
          parseInt(late_grace_minutes, 10) || 0
        ]
      );
    }

    res.json({ message: "OT settings updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
