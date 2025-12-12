-- Employees/Users table (Already exists, but ensuring structure for reference)
-- CREATE TABLE IF NOT EXISTS authentication (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   employee_id VARCHAR(50) UNIQUE NOT NULL,
--   first_name VARCHAR(100),
--   last_name VARCHAR(100),
--   email VARCHAR(100) UNIQUE,
--   password_hash VARCHAR(255),
--   role VARCHAR(50),
--   department VARCHAR(100),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- 7. Fingerprints
CREATE TABLE IF NOT EXISTS fingerprints (
  fingerprint_id INT PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(employee_id)
);

-- 1. Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  day_of_week VARCHAR(255) NOT NULL, 
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_rest_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_schedule (employee_id, day_of_week)
);

-- 2. Attendance Logs (Raw scans)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  scan_time DATETIME NOT NULL,
  type ENUM('IN', 'OUT') NOT NULL,
  source VARCHAR(255) DEFAULT 'WEB', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Daily Time Records (Processed daily summary)
CREATE TABLE IF NOT EXISTS daily_time_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time_in DATETIME,
  time_out DATETIME,
  late_minutes INT DEFAULT 0,
  undertime_minutes INT DEFAULT 0,
  overtime_minutes INT DEFAULT 0,
  status VARCHAR(255) DEFAULT 'Present', -- Present, Absent, Late, Leave
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dtr (employee_id, date)
);

-- 4. Leave Credits (New)
CREATE TABLE IF NOT EXISTS leave_credits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  credit_type VARCHAR(50) NOT NULL, -- e.g. 'Vacation', 'Sick'
  balance DECIMAL(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_credit (employee_id, credit_type)
);

-- 5. Leave Requests (Updated)
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  leave_type VARCHAR(255) NOT NULL, -- Sick, Vacation, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  attachment_path VARCHAR(255) DEFAULT NULL, -- Employee initial upload
  admin_form_path VARCHAR(255) DEFAULT NULL, -- Admin upload for processing
  final_attachment_path VARCHAR(255) DEFAULT NULL, -- Employee signed form
  with_pay BOOLEAN DEFAULT FALSE,
  status ENUM('Pending', 'Processing', 'Finalizing', 'Approved', 'Rejected') DEFAULT 'Pending',
  rejection_reason TEXT,
  approved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. DTR Corrections
CREATE TABLE IF NOT EXISTS dtr_corrections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  date_time DATE NOT NULL, -- The date being corrected
  original_time_in DATETIME,
  original_time_out DATETIME,
  corrected_time_in DATETIME,
  corrected_time_out DATETIME,
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  rejection_reason TEXT,
  approved_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Undertime Requests
CREATE TABLE IF NOT EXISTS undertime_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  rejection_reason TEXT,
  approved_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Events
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time INT DEFAULT 9,
  description TEXT,
  recurring_pattern VARCHAR(50) DEFAULT 'none',
  recurring_end_date DATE,
  parent_event_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Google Calendar Integration - OAuth Tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry DATETIME NOT NULL,
  calendar_id VARCHAR(255) DEFAULT 'primary',
  last_sync DATETIME,
  sync_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES authentication(employee_id)
);

-- 11. Google Calendar Integration - Event Sync Mapping
CREATE TABLE IF NOT EXISTS synced_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  local_event_id INT NOT NULL,
  google_event_id VARCHAR(255) NOT NULL,
  last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (local_event_id),
  FOREIGN KEY (local_event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),
  reference_id INT,
  status ENUM('read', 'unread') DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Leave Credit Requests (Employee applications for leave credits)
CREATE TABLE IF NOT EXISTS leave_credit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  credit_type VARCHAR(100) NOT NULL,
  requested_amount DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  admin_remarks TEXT,
  approved_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

