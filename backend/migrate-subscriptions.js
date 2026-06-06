require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "attendance_db",
  });

  try {
    console.log("Adding subscription columns to companies table...");
    await connection.query(`
      ALTER TABLE companies 
      ADD COLUMN trial_ends_at TIMESTAMP NULL,
      ADD COLUMN subscription_plan ENUM('FREE', 'MONTHLY', 'YEARLY') DEFAULT 'FREE',
      ADD COLUMN subscription_status ENUM('TRIAL', 'ACTIVE', 'EXPIRED') DEFAULT 'TRIAL',
      ADD COLUMN subscription_ends_at TIMESTAMP NULL,
      ADD COLUMN first_purchase_done BOOLEAN DEFAULT FALSE
    `);
    console.log("Migration successful!");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist. No migration needed.");
    } else {
      console.error("Migration failed:", err);
    }
  } finally {
    await connection.end();
  }
}

migrate();