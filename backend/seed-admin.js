/**
 * Ensures default company + admin exist for web login.
 * Run: node seed-admin.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./src/db");

const COMPANY_CODE = "CMP-01";
const COMPANY_NAME = "Default Company";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin@123";

(async () => {
  try {
    const hash = await bcrypt.hash(ADMIN_PASS, 10);

    await pool.query(
      "INSERT IGNORE INTO companies (company_code, name) VALUES (?, ?)",
      [COMPANY_CODE, COMPANY_NAME]
    );

    const [comps] = await pool.query("SELECT id FROM companies WHERE company_code = ?", [COMPANY_CODE]);
    const companyId = comps[0]?.id;
    if (!companyId) {
      console.error("Could not find or create company.");
      process.exit(1);
    }

    const [users] = await pool.query(
      "SELECT id FROM users WHERE username = ? AND company_id = ?",
      [ADMIN_USER, companyId]
    );

    if (users.length) {
      await pool.query("UPDATE users SET password_hash = ?, role = 'ADMIN', status = 'ACTIVE' WHERE id = ?", [
        hash,
        users[0].id
      ]);
      console.log("Updated existing admin password.");
    } else {
      await pool.query(
        "INSERT INTO users (company_id, username, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
        [companyId, ADMIN_USER, hash]
      );
      console.log("Created new admin user.");
    }

    console.log("\n--- Web login credentials ---");
    console.log("Company Code:", COMPANY_CODE);
    console.log("Username:    ", ADMIN_USER);
    console.log("Password:    ", ADMIN_PASS);
    console.log("URL:          http://localhost:3000");
    console.log("-----------------------------\n");
  } catch (err) {
    console.error("Seed failed:", err.message);
    if (err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ECONNREFUSED") {
      console.error("Check backend/.env — MySQL must be running (DB_HOST, DB_USER, DB_PASS, DB_NAME).");
    }
    process.exit(1);
  }
  process.exit(0);
})();
