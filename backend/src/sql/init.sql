-- 1. Database Create Karein
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 2. Companies Table (Har company ka alag account hoga)
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
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

-- 8. Default Data Insert karein (Taaki aap turant test kar sakein)
INSERT IGNORE INTO companies (id, company_code, name) VALUES (1, 'CMP-01', 'Default Company');

-- Password: Admin@123
INSERT IGNORE INTO users (company_id, username, password_hash, role)
VALUES (1, 'admin', '$2a$10$wyDpV0t39sTX/HhUpScgDuSZFR3Nv/JCTe3dJkeKIlHN5Al1tJxXq', 'ADMIN');