require('dotenv').config();
const pool = require('./src/db');

async function migrate() {
  try {
    console.log("Adding payslips table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payslips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year VARCHAR(4) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("Payslips table created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();