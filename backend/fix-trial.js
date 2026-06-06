require('dotenv').config();
const pool = require('./src/db');
(async () => {
  try {
    await pool.query("ALTER TABLE companies ADD COLUMN trial_ends_at TIMESTAMP NULL;");
    console.log('Added trial_ends_at column to companies');
  } catch (e) {
    console.log('Column might already exist:', e.message);
  }
  try {
    await pool.query("ALTER TABLE companies ADD COLUMN subscription_plan ENUM('FREE', 'MONTHLY', 'YEARLY') DEFAULT 'FREE';");
    console.log('Added subscription_plan column to companies');
  } catch (e) {
    console.log('subscription_plan might already exist:', e.message);
  }
  try {
    await pool.query("ALTER TABLE companies ADD COLUMN subscription_status ENUM('TRIAL', 'ACTIVE', 'EXPIRED') DEFAULT 'TRIAL';");
    console.log('Added subscription_status column to companies');
  } catch (e) {
    console.log('subscription_status might already exist:', e.message);
  }
  try {
    await pool.query("ALTER TABLE companies ADD COLUMN subscription_ends_at TIMESTAMP NULL;");
    console.log('Added subscription_ends_at column to companies');
  } catch (e) {
    console.log('subscription_ends_at might already exist:', e.message);
  }
  try {
    await pool.query("ALTER TABLE companies ADD COLUMN first_purchase_done BOOLEAN DEFAULT FALSE;");
    console.log('Added first_purchase_done column to companies');
  } catch (e) {
    console.log('first_purchase_done might already exist:', e.message);
  }
  
  try {
    await pool.query("UPDATE companies SET trial_ends_at = DATE_ADD(created_at, INTERVAL 30 DAY) WHERE trial_ends_at IS NULL");
    console.log('Fixed missing trial_ends_at in companies');
  } catch (e) {
    console.error('Error fixing trial_ends_at:', e.message);
  }
  process.exit(0);
})();
