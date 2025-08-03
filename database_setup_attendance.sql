-- Attendance Management Tables

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'leave') NOT NULL,
  leave_type ENUM('sick', 'personal', 'vacation', 'emergency', 'other') NULL,
  leave_reason TEXT NULL,
  approver VARCHAR(255) NULL,
  is_advanced_leave BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_employee_date (employee_id, date),
  INDEX idx_employee_id (employee_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  leave_type ENUM('sick', 'personal', 'vacation', 'emergency', 'other') NOT NULL,
  reason TEXT NOT NULL,
  approver_id VARCHAR(255) NOT NULL,
  approver_name VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  is_advanced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_employee_id (employee_id),
  INDEX idx_approver_id (approver_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create attendance_summary table for reporting
CREATE TABLE IF NOT EXISTS attendance_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  present_days INT DEFAULT 0,
  leave_days INT DEFAULT 0,
  total_working_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_employee_month_year (employee_id, month, year),
  INDEX idx_employee_id (employee_id),
  INDEX idx_month_year (month, year)
);