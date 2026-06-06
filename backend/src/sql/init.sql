-- 1. Database is provided by host (e.g., Railway)
-- CREATE DATABASE IF NOT EXISTS attendance_db;
-- USE attendance_db;

-- 2. Companies Table (Har company ka alag account hoga)
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  trial_ends_at TIMESTAMP NULL,
  subscription_plan ENUM('FREE', 'MONTHLY', 'YEARLY') DEFAULT 'FREE',
  subscription_status ENUM('TRIAL', 'ACTIVE', 'EXPIRED') DEFAULT 'TRIAL',
  subscription_ends_at TIMESTAMP NULL,
  first_purchase_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table (Web Dashboard par login karne ke liye - HR/Admin)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPERADMIN', 'ADMIN', 'HR', 'SUPERVISOR') DEFAULT 'ADMIN',
  employee_id INT DEFAULT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE(company_id, username)
);

-- 4. Employees Table (App me login karne ke liye)
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  emp_code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100) DEFAULT 'Employee',
  password_hash VARCHAR(255) NOT NULL,
  plain_password VARCHAR(255) DEFAULT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE(company_id, emp_code)
);

-- 5. Attendance Table (Check-in / Check-out data)
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  att_date DATE NOT NULL,
  check_in DATETIME DEFAULT NULL,
  check_out DATETIME DEFAULT NULL,
  check_in_location VARCHAR(255) DEFAULT NULL,
  check_out_location VARCHAR(255) DEFAULT NULL,
  total_minutes INT DEFAULT 0,
  overtime_minutes INT DEFAULT 0,
  status ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY') DEFAULT 'PRESENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE(employee_id, att_date)
);

-- 6. Punch Logs Table (Bina kisi limit ke multiple check-in/check-out track karne ke liye)
CREATE TABLE IF NOT EXISTS punch_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  attendance_id INT NOT NULL,
  punch_time DATETIME NOT NULL,
  punch_type ENUM('IN', 'OUT') NOT NULL,
  location VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (attendance_id) REFERENCES attendance(id)
);

-- 7. Notices Table (Notice Board for App & Web)
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 8. Leaves Table (Employee leave requests)
CREATE TABLE IF NOT EXISTS leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type VARCHAR(50) DEFAULT 'Annual Leave',
  reason TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 9. Payslips Table (Salary slips)
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
);

-- 10. OT Settings Table (Overtime configuration per company)
CREATE TABLE IF NOT EXISTS ot_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  standard_hours DECIMAL(5,2) DEFAULT 9.0,
  ot_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
  ot_applicable_from_minutes INT DEFAULT 540,
  max_daily_ot_minutes INT DEFAULT 180,
  weekly_off_days VARCHAR(20) DEFAULT 'Saturday,Sunday',
  ot_payment_condition VARCHAR(100) DEFAULT 'Above standard hours',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(company_id)
);

-- 11. Default Data Insert karein (Taaki aap turant test kar sakein)
INSERT IGNORE INTO companies (id, company_code, name) VALUES (1, 'CMP-01', 'Default Company');

-- Password: Admin@123
INSERT IGNORE INTO users (company_id, username, password_hash, role)
VALUES (1, 'admin', '$2a$10$wyDpV0t39sTX/HhUpScgDuSZFR3Nv/JCTe3dJkeKIlHN5Al1tJxXq', 'ADMIN');

-- Default OT Settings
INSERT IGNORE INTO ot_settings (company_id, standard_hours, ot_rate_multiplier, ot_applicable_from_minutes, max_daily_ot_minutes, weekly_off_days)
VALUES (1, 9.0, 1.5, 540, 180, 'Saturday,Sunday');