-- 1. Database is provided by host (e.g., Railway)
-- CREATE DATABASE IF NOT EXISTS attendance_db;
-- USE attendance_db;

-- 2. Companies Table (Har company ka alag account hoga)
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NULL UNIQUE,
  trial_ends_at TIMESTAMP NULL,
  subscription_plan ENUM('FREE', 'MONTHLY', 'YEARLY') DEFAULT 'FREE',
  subscription_status ENUM('TRIAL', 'ACTIVE', 'EXPIRED') DEFAULT 'TRIAL',
  subscription_ends_at TIMESTAMP NULL,
  first_purchase_done BOOLEAN DEFAULT FALSE,
  settings JSON NULL,
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
  profile_photo VARCHAR(255) DEFAULT NULL,
  shift_start_time TIME DEFAULT NULL,
  shift_end_time TIME DEFAULT NULL,
  standard_hours DECIMAL(5,2) DEFAULT NULL,
  weekly_off_days VARCHAR(50) DEFAULT NULL,
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

CREATE TABLE IF NOT EXISTS attendance_corrections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_id INT NOT NULL,
  corrected_by INT NOT NULL,
  old_check_in DATETIME DEFAULT NULL,
  old_check_out DATETIME DEFAULT NULL,
  old_status VARCHAR(30) DEFAULT NULL,
  old_total_minutes INT DEFAULT 0,
  new_check_in DATETIME DEFAULT NULL,
  new_check_out DATETIME DEFAULT NULL,
  new_status VARCHAR(30) DEFAULT NULL,
  new_total_minutes INT DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
  FOREIGN KEY (corrected_by) REFERENCES users(id)
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
  request_type VARCHAR(30) DEFAULT 'FULL_DAY',
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  duration_minutes INT DEFAULT 0,
  is_company_work BOOLEAN DEFAULT FALSE,
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

-- 10. Billing Orders Table (Razorpay order tracking - plan verified server-side)
CREATE TABLE IF NOT EXISTS billing_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  plan ENUM('MONTHLY', 'YEARLY') NOT NULL,
  amount INT NOT NULL,
  status ENUM('PENDING', 'COMPLETED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 11. Processed Payments Table (prevent duplicate payment processing)
CREATE TABLE IF NOT EXISTS processed_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  razorpay_payment_id VARCHAR(100) NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL,
  plan ENUM('MONTHLY', 'YEARLY') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_payment (company_id, razorpay_payment_id)
);

-- 12. OT Settings Table (Overtime configuration per company)
CREATE TABLE IF NOT EXISTS ot_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  standard_hours DECIMAL(5,2) DEFAULT 9.0,
  shift_start_time TIME DEFAULT '09:00:00',
  shift_end_time TIME DEFAULT '18:00:00',
  late_grace_minutes INT DEFAULT 0,
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
