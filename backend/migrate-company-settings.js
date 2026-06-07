/**
 * Add per-company settings + admin email to existing databases.
 * Usage: node migrate-company-settings.js
 */
require("dotenv").config();
const pool = require("./src/db");

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function migrate() {
  if (!(await columnExists("companies", "admin_email"))) {
    console.log("Adding admin_email column...");
    await pool.query("ALTER TABLE companies ADD COLUMN admin_email VARCHAR(255) NULL UNIQUE AFTER name");
  }

  if (!(await columnExists("companies", "settings"))) {
    console.log("Adding settings JSON column...");
    await pool.query(
      `ALTER TABLE companies ADD COLUMN settings JSON NULL AFTER first_purchase_done`
    );
  }

  console.log("Setting default per-company features for existing companies...");
  const defaultSettings = JSON.stringify({
    ai_assistant: true,
    payslips: true,
    leave_management: true,
    notice_board: true,
    overtime_tracking: true,
    bulk_employee_gen: false,
  });
  await pool.query("UPDATE companies SET settings = ? WHERE settings IS NULL", [defaultSettings]);

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
