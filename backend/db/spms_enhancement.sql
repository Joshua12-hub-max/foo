-- =====================================================
-- SPMS CSC-Compliant Enhancement Migration
-- Strategic Performance Management System
-- Based on Philippine CSC Guidelines
-- =====================================================

-- =====================================================
-- 1. EMPLOYEE PROFILE ENHANCEMENT
-- =====================================================
ALTER TABLE authentication
  ADD COLUMN IF NOT EXISTS date_hired DATE,
  ADD COLUMN IF NOT EXISTS employment_status ENUM('Regular', 'Contractual', 'Casual', 'Job Order', 'Consultant') DEFAULT 'Regular';

-- =====================================================
-- 2. COACHING LOG / MONITORING MODULE
-- For monthly supervisor coaching sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS spms_coaching_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ipcr_id INT,
  employee_id INT NOT NULL,
  supervisor_id INT NOT NULL,
  coaching_date DATE NOT NULL,
  coaching_type ENUM('Monthly Check-in', 'Performance Coaching', 'Improvement Discussion', 'Career Development', 'Mid-Year Review') DEFAULT 'Monthly Check-in',
  discussion_topics TEXT,
  agreed_actions TEXT COMMENT 'Action items agreed upon during session',
  employee_feedback TEXT COMMENT 'Employee input during coaching',
  supervisor_notes TEXT COMMENT 'Supervisor observations and recommendations',
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  status ENUM('Scheduled', 'Completed', 'Rescheduled', 'Cancelled') DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES authentication(id) ON DELETE CASCADE,
  INDEX idx_coaching_employee (employee_id),
  INDEX idx_coaching_supervisor (supervisor_id),
  INDEX idx_coaching_date (coaching_date),
  INDEX idx_coaching_status (status)
);

-- =====================================================
-- 3. PROFESSIONAL DEVELOPMENT PLAN (PDP)
-- Mandatory for Unsatisfactory/Poor rated employees
-- =====================================================
CREATE TABLE IF NOT EXISTS spms_development_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  ipcr_id INT COMMENT 'Link to the IPCR that triggered the PDP',
  cycle_id INT NOT NULL,
  
  -- Gap Analysis
  competency_gap TEXT NOT NULL COMMENT 'Identified performance/competency gap',
  current_proficiency_level ENUM('Beginner', 'Developing', 'Proficient', 'Advanced', 'Expert') DEFAULT 'Developing',
  target_proficiency_level ENUM('Beginner', 'Developing', 'Proficient', 'Advanced', 'Expert') DEFAULT 'Proficient',
  
  -- Development Objectives
  development_objective TEXT NOT NULL COMMENT 'SMART objective for development',
  development_activities TEXT COMMENT 'Planned activities to address gap',
  resources_needed TEXT COMMENT 'Resources required (budget, time, materials)',
  
  -- Timeline
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  
  -- Progress Tracking
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  progress_notes TEXT,
  milestones TEXT COMMENT 'JSON array of milestones with dates',
  
  -- Status and Approval
  status ENUM('Draft', 'Pending Approval', 'Active', 'On Hold', 'Completed', 'Extended', 'Cancelled') DEFAULT 'Draft',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  
  -- Metadata
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id) ON DELETE SET NULL,
  FOREIGN KEY (cycle_id) REFERENCES spms_cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES authentication(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES authentication(id) ON DELETE SET NULL,
  INDEX idx_pdp_employee (employee_id),
  INDEX idx_pdp_cycle (cycle_id),
  INDEX idx_pdp_status (status)
);

-- =====================================================
-- 4. TRAINING NEEDS / INTERVENTION RECOMMENDATIONS
-- Track recommended and completed trainings
-- =====================================================
CREATE TABLE IF NOT EXISTS spms_training_needs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  ipcr_id INT COMMENT 'Link to IPCR if identified from evaluation',
  development_plan_id INT COMMENT 'Link to PDP if part of development plan',
  
  -- Training Details
  training_type ENUM('Technical', 'Behavioral', 'Leadership', 'Compliance', 'Orientation', 'Specialized') DEFAULT 'Technical',
  training_title VARCHAR(255) NOT NULL,
  training_description TEXT,
  training_provider VARCHAR(255) COMMENT 'e.g., CSC, CHED, Internal, External Provider',
  
  -- Priority and Urgency
  priority ENUM('Critical', 'High', 'Medium', 'Low') DEFAULT 'Medium',
  is_mandatory BOOLEAN DEFAULT FALSE COMMENT 'Required for job performance or compliance',
  
  -- Status Tracking
  status ENUM('Recommended', 'Approved', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Deferred') DEFAULT 'Recommended',
  scheduled_date DATE,
  completion_date DATE,
  
  -- Verification
  certificate_file VARCHAR(255) COMMENT 'Path to uploaded certificate',
  verified_by INT,
  verified_at TIMESTAMP NULL,
  
  -- Assessment
  pre_training_assessment TEXT COMMENT 'Baseline competency before training',
  post_training_assessment TEXT COMMENT 'Competency improvement after training',
  effectiveness_rating DECIMAL(3,2) COMMENT '1.0-5.0 rating of training effectiveness',
  
  -- Metadata
  recommended_by INT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id) ON DELETE SET NULL,
  FOREIGN KEY (development_plan_id) REFERENCES spms_development_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (recommended_by) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES authentication(id) ON DELETE SET NULL,
  INDEX idx_training_employee (employee_id),
  INDEX idx_training_status (status),
  INDEX idx_training_type (training_type),
  INDEX idx_training_priority (priority)
);

-- =====================================================
-- 5. MFO BUDGET ALLOCATION
-- Add budget tracking to Major Final Outputs
-- =====================================================
ALTER TABLE spms_mfo
  ADD COLUMN IF NOT EXISTS allotted_budget DECIMAL(15, 2) DEFAULT 0 COMMENT 'Allocated budget for this MFO',
  ADD COLUMN IF NOT EXISTS actual_expenditure DECIMAL(15, 2) DEFAULT 0 COMMENT 'Actual amount spent',
  ADD COLUMN IF NOT EXISTS budget_source VARCHAR(100) COMMENT 'Source of budget (GAA, Special Fund, etc.)',
  ADD COLUMN IF NOT EXISTS fiscal_year INT,
  ADD COLUMN IF NOT EXISTS budget_remarks TEXT;

-- =====================================================
-- 6. MID-YEAR REVIEW TRACKING
-- Add explicit mid-year review fields to IPCR
-- =====================================================
ALTER TABLE spms_ipcr
  ADD COLUMN IF NOT EXISTS mid_year_review_date DATE,
  ADD COLUMN IF NOT EXISTS mid_year_rating DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS mid_year_adjectival_rating ENUM('Outstanding', 'Very Satisfactory', 'Satisfactory', 'Unsatisfactory', 'Poor'),
  ADD COLUMN IF NOT EXISTS mid_year_accomplishments TEXT COMMENT 'Summary of accomplishments at mid-year',
  ADD COLUMN IF NOT EXISTS mid_year_challenges TEXT COMMENT 'Challenges encountered at mid-year',
  ADD COLUMN IF NOT EXISTS mid_year_recommendations TEXT COMMENT 'Recommendations for second half',
  ADD COLUMN IF NOT EXISTS mid_year_reviewed_by INT,
  ADD COLUMN IF NOT EXISTS mid_year_employee_remarks TEXT,
  ADD COLUMN IF NOT EXISTS mid_year_supervisor_remarks TEXT;

-- Add foreign key constraint separately to handle existing table
-- ALTER TABLE spms_ipcr ADD FOREIGN KEY (mid_year_reviewed_by) REFERENCES authentication(id) ON DELETE SET NULL;

-- =====================================================
-- 7. ENHANCED AUDIT LOGGING FOR MONITORING
-- Track all coaching and development activities
-- =====================================================
CREATE TABLE IF NOT EXISTS spms_monitoring_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_type ENUM('coaching', 'development_plan', 'training', 'mid_year_review') NOT NULL,
  reference_id INT NOT NULL COMMENT 'ID of the coaching/pdp/training record',
  action VARCHAR(100) NOT NULL,
  performed_by INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  details TEXT COMMENT 'JSON details of the action',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (performed_by) REFERENCES authentication(id) ON DELETE CASCADE,
  INDEX idx_monitoring_type (log_type),
  INDEX idx_monitoring_reference (reference_id),
  INDEX idx_monitoring_date (created_at)
);

-- =====================================================
-- 8. NOTIFICATION TYPES FOR SPMS
-- Insert notification type constants for reference
-- =====================================================
CREATE TABLE IF NOT EXISTS spms_notification_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_code VARCHAR(50) NOT NULL UNIQUE,
  type_name VARCHAR(100) NOT NULL,
  description TEXT,
  template_subject VARCHAR(255),
  template_body TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT IGNORE INTO spms_notification_types (type_code, type_name, description, template_subject, template_body) VALUES
('ipcr_deadline', 'IPCR Deadline Reminder', 'Reminder for IPCR submission deadline', 'IPCR Submission Deadline Approaching', 'Your IPCR for {cycle_name} is due on {due_date}. Please submit your commitment/accomplishments.'),
('mid_year_reminder', 'Mid-Year Review Reminder', 'Reminder for mid-year performance check-in', 'Mid-Year Performance Review', 'Your mid-year performance review for {cycle_name} is scheduled. Please prepare your accomplishment report.'),
('coaching_scheduled', 'Coaching Session Scheduled', 'Notification when coaching session is scheduled', 'Coaching Session Scheduled', 'A coaching session has been scheduled for {date} with {supervisor_name}.'),
('coaching_reminder', 'Coaching Session Reminder', 'Reminder before scheduled coaching session', 'Upcoming Coaching Session', 'Reminder: You have a coaching session scheduled for {date}.'),
('pdp_created', 'Development Plan Created', 'Notification when PDP is created for employee', 'Professional Development Plan Created', 'A Professional Development Plan has been created for you. Please review the objectives and activities.'),
('pdp_progress_update', 'PDP Progress Update', 'Reminder to update PDP progress', 'Development Plan Progress Update Needed', 'Please update your progress on your Professional Development Plan for {competency_gap}.'),
('training_assigned', 'Training Assigned', 'Notification when training is recommended', 'Training Recommendation', 'A training has been recommended for you: {training_title}. Priority: {priority}.'),
('training_reminder', 'Training Reminder', 'Reminder for scheduled training', 'Upcoming Training Reminder', 'Reminder: Your training "{training_title}" is scheduled for {date}.'),
('training_completion', 'Training Completed', 'Confirmation of training completion', 'Training Completed', 'Congratulations! Your completion of "{training_title}" has been recorded.'),
('rating_finalized', 'Performance Rating Finalized', 'Notification when IPCR rating is finalized', 'Performance Rating Finalized', 'Your performance rating for {cycle_name} has been finalized. Final Rating: {rating}.');

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_auth_employment ON authentication(employment_status);
CREATE INDEX IF NOT EXISTS idx_auth_date_hired ON authentication(date_hired);

-- =====================================================
-- VIEW: Employee Coaching Summary
-- Useful for reporting
-- =====================================================
CREATE OR REPLACE VIEW v_employee_coaching_summary AS
SELECT 
  e.id as employee_id,
  CONCAT(e.first_name, ' ', e.last_name) as employee_name,
  e.department,
  COUNT(c.id) as total_sessions,
  SUM(CASE WHEN c.status = 'Completed' THEN 1 ELSE 0 END) as completed_sessions,
  SUM(CASE WHEN c.status = 'Scheduled' THEN 1 ELSE 0 END) as pending_sessions,
  MAX(c.coaching_date) as last_coaching_date,
  MIN(CASE WHEN c.status = 'Scheduled' AND c.coaching_date >= CURDATE() THEN c.coaching_date END) as next_coaching_date
FROM authentication e
LEFT JOIN spms_coaching_logs c ON e.id = c.employee_id
WHERE e.role != 'admin'
GROUP BY e.id, e.first_name, e.last_name, e.department;

-- =====================================================
-- VIEW: Development Plan Status Summary
-- =====================================================
CREATE OR REPLACE VIEW v_development_plan_summary AS
SELECT 
  d.id as plan_id,
  e.id as employee_id,
  CONCAT(e.first_name, ' ', e.last_name) as employee_name,
  e.department,
  d.competency_gap,
  d.status,
  d.progress_percentage,
  d.target_completion_date,
  DATEDIFF(d.target_completion_date, CURDATE()) as days_remaining,
  c.title as cycle_name,
  i.adjectival_rating as ipcr_rating
FROM spms_development_plans d
JOIN authentication e ON d.employee_id = e.id
JOIN spms_cycles c ON d.cycle_id = c.id
LEFT JOIN spms_ipcr i ON d.ipcr_id = i.id;

-- =====================================================
-- VIEW: Training Needs Summary by Department
-- =====================================================
CREATE OR REPLACE VIEW v_training_needs_by_department AS
SELECT 
  e.department,
  t.training_type,
  t.priority,
  COUNT(*) as total_needs,
  SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.status IN ('Recommended', 'Approved') THEN 1 ELSE 0 END) as pending
FROM spms_training_needs t
JOIN authentication e ON t.employee_id = e.id
GROUP BY e.department, t.training_type, t.priority;
