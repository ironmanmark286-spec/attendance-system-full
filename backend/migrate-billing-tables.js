/**
 * Run once on existing production DB to add billing security tables.
 * Usage: node migrate-billing-tables.js
 */
require("dotenv").config();
const pool = require("./src/db");

async function migrate() {
  console.log("Creating billing_orders table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS billing_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
      plan ENUM('MONTHLY', 'YEARLY') NOT NULL,
      amount INT NOT NULL,
      status ENUM('PENDING', 'COMPLETED') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  console.log("Creating processed_payments table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS processed_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      razorpay_payment_id VARCHAR(100) NOT NULL,
      razorpay_order_id VARCHAR(100) NOT NULL,
      plan ENUM('MONTHLY', 'YEARLY') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      UNIQUE KEY unique_payment (company_id, razorpay_payment_id)
    )
  `);

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
