require('dotenv').config();
const pool = require('./src/db');
(async () => {
  try {
    await pool.query('ALTER TABLE employees ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL;');
    console.log('Added plain_password to employees');
  } catch (e) {
    console.log('plain_password error:', e.message);
  }
  try {
    await pool.query('ALTER TABLE attendance ADD COLUMN check_in_location VARCHAR(255) DEFAULT NULL;');
    console.log('Added check_in_location');
  } catch (e) {
    console.log('check_in_location error:', e.message);
  }
  try {
    await pool.query('ALTER TABLE attendance ADD COLUMN check_out_location VARCHAR(255) DEFAULT NULL;');
    console.log('Added check_out_location');
  } catch (e) {
    console.log('check_out_location error:', e.message);
  }
  try {
    await pool.query('ALTER TABLE attendance ADD COLUMN overtime_minutes INT DEFAULT 0;');
    console.log('Added overtime_minutes');
  } catch (e) {
    console.log('overtime_minutes error:', e.message);
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS punch_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        attendance_id INT NOT NULL,
        punch_time DATETIME NOT NULL,
        punch_type ENUM('IN', 'OUT') NOT NULL,
        location VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE
      )
    `);
    console.log('Created punch_logs table successfully');
  } catch (e) {
    console.log('punch_logs table error:', e.message);
  }
  process.exit(0);
})();
