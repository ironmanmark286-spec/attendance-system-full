require('dotenv').config();
const pool = require('./src/db');

async function wipe() {
  try {
    console.log("Connecting to database...");
    
    // Disable foreign key checks to allow truncating tables with foreign keys
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Check if leaves table exists and truncate
    try {
      await pool.query('TRUNCATE TABLE leaves');
      console.log("Leaves table cleared.");
    } catch (e) {
      console.log("Leaves table might not exist yet, skipping.");
    }

    // Check if punch_logs table exists and truncate
    try {
      await pool.query('TRUNCATE TABLE punch_logs');
      console.log("Punch logs table cleared.");
    } catch (e) {
      console.log("Punch logs table might not exist yet, skipping.");
    }

    // Check if attendance table exists and truncate
    try {
      await pool.query('TRUNCATE TABLE attendance');
      console.log("Attendance table cleared.");
    } catch (e) {
      console.log("Attendance table might not exist yet, skipping.");
    }
    
    // Truncate users, employees, companies
    await pool.query('TRUNCATE TABLE users');
    console.log("Users table cleared.");
    
    await pool.query('TRUNCATE TABLE employees');
    console.log("Employees table cleared.");
    
    await pool.query('TRUNCATE TABLE companies');
    console.log("Companies table cleared.");

    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log("\nDatabase completely wiped! All companies, credentials, and records are deleted.");
    console.log("You can now register fresh.");
    process.exit(0);
  } catch(e) {
    console.error("Failed to wipe database:", e);
    process.exit(1);
  }
}

wipe();