const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

// Get OT settings for a company
router.get("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
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
        ot_payment_condition: "Above standard hours"
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
    const { standard_hours, ot_rate_multiplier, ot_applicable_from_minutes, max_daily_ot_minutes, weekly_off_days, ot_payment_condition } = req.body;
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
         max_daily_ot_minutes = ?, weekly_off_days = ?, ot_payment_condition = ? 
         WHERE company_id = ?`,
        [standard_hours, ot_rate_multiplier, ot_applicable_from_minutes, max_daily_ot_minutes, weekly_off_days, ot_payment_condition, companyId]
      );
    } else {
      await pool.query(
        `INSERT INTO ot_settings (company_id, standard_hours, ot_rate_multiplier, ot_applicable_from_minutes, max_daily_ot_minutes, weekly_off_days, ot_payment_condition)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [companyId, standard_hours, ot_rate_multiplier, ot_applicable_from_minutes, max_daily_ot_minutes, weekly_off_days, ot_payment_condition]
      );
    }

    res.json({ message: "OT settings updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
