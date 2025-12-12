-- SPMS Full Compliance Migration
-- CSC MC 6 Series 2012 Complete Implementation
-- Run this migration to add all missing SPMS tables

-- =====================================================
-- OPCR (Office Performance Commitment and Review)
-- =====================================================

CREATE TABLE IF NOT EXISTS spms_opcr (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department VARCHAR(100) NOT NULL,
  cycle_id INT NOT NULL,
  prepared_by INT NOT NULL,
  reviewed_by INT,
  approved_by INT,
  status ENUM('Draft', 'Submitted', 'PMT Review', 'Approved', 'Finalized') DEFAULT 'Draft',
  total_budget DECIMAL(15,2) DEFAULT 0,
  actual_expenses DECIMAL(15,2) DEFAULT 0,
  final_rating DECIMAL(3,2),
  adjectival_rating VARCHAR(20),
  date_submitted DATE,
  date_reviewed DATE,
  date_approved DATE,
  pmt_remarks TEXT,
  approver_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cycle_id) REFERENCES spms_cycles(id),
  FOREIGN KEY (prepared_by) REFERENCES authentication(id),
  FOREIGN KEY (reviewed_by) REFERENCES authentication(id),
  FOREIGN KEY (approved_by) REFERENCES authentication(id),
  UNIQUE KEY unique_dept_cycle (department, cycle_id)
);

-- OPCR Items (MFO-based targets with budget)
CREATE TABLE IF NOT EXISTS spms_opcr_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  opcr_id INT NOT NULL,
  mfo_id INT,
  program_project VARCHAR(255),
  output_description TEXT NOT NULL,
  success_indicator TEXT,
  target VARCHAR(255),
  budget_allocation DECIMAL(15,2) DEFAULT 0,
  actual_accomplishment TEXT,
  actual_expenses DECIMAL(15,2) DEFAULT 0,
  rating_quality DECIMAL(3,2),
  rating_efficiency DECIMAL(3,2),
  rating_timeliness DECIMAL(3,2),
  average_rating DECIMAL(3,2),
  weight DECIMAL(5,2) DEFAULT 10,
  responsible_unit VARCHAR(100),
  responsible_person VARCHAR(100),
  remarks TEXT,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (opcr_id) REFERENCES spms_opcr(id) ON DELETE CASCADE,
  FOREIGN KEY (mfo_id) REFERENCES spms_mfo(id) ON DELETE SET NULL
);

-- OPCR Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS spms_opcr_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  opcr_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  performed_by INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opcr_id) REFERENCES spms_opcr(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES authentication(id)
);

-- =====================================================
-- APPEALS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS spms_appeals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ipcr_id INT NOT NULL,
  employee_id INT NOT NULL,
  appeal_date DATE NOT NULL,
  grounds TEXT NOT NULL,
  supporting_documents TEXT,
  status ENUM('Filed', 'Under Review', 'Scheduled', 'Decided', 'Withdrawn') DEFAULT 'Filed',
  pmt_decision ENUM('Upheld', 'Modified', 'Reversed'),
  hearing_date DATE,
  decision_date DATE,
  decision_remarks TEXT,
  decided_by INT,
  original_rating DECIMAL(3,2),
  original_adjectival VARCHAR(20),
  new_rating DECIMAL(3,2),
  new_adjectival VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id),
  FOREIGN KEY (employee_id) REFERENCES authentication(id),
  FOREIGN KEY (decided_by) REFERENCES authentication(id)
);

-- =====================================================
-- PMT (Performance Management Team)
-- =====================================================

CREATE TABLE IF NOT EXISTS spms_pmt_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  role ENUM('Chairperson', 'Vice Chairperson', 'Member', 'Secretariat') NOT NULL,
  designation VARCHAR(100),
  office VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  appointed_date DATE,
  end_date DATE,
  appointment_order VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id),
  UNIQUE KEY unique_active_member (employee_id, is_active)
);

-- PMT Meetings/Deliberations
CREATE TABLE IF NOT EXISTS spms_pmt_meetings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cycle_id INT,
  meeting_type ENUM('OPCR Review', 'Calibration', 'Appeals', 'Regular', 'Special') NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  venue VARCHAR(255),
  agenda TEXT,
  attendees TEXT,
  absentees TEXT,
  minutes TEXT,
  resolutions TEXT,
  action_items TEXT,
  status ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cycle_id) REFERENCES spms_cycles(id),
  FOREIGN KEY (created_by) REFERENCES authentication(id)
);

-- PMT Meeting Attachments
CREATE TABLE IF NOT EXISTS spms_pmt_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  meeting_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES spms_pmt_meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES authentication(id)
);

-- =====================================================
-- PERFORMANCE NOTICES & SANCTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS spms_performance_notices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  ipcr_id INT NOT NULL,
  notice_type ENUM('Warning', 'Development Required', 'Show Cause', 'Separation Recommendation') NOT NULL,
  notice_number VARCHAR(50),
  rating_period VARCHAR(50),
  rating_value DECIMAL(3,2),
  adjectival_rating VARCHAR(20),
  notice_date DATE NOT NULL,
  effective_date DATE,
  deadline_date DATE,
  status ENUM('Draft', 'Issued', 'Acknowledged', 'Complied', 'Escalated', 'Cancelled') DEFAULT 'Draft',
  issued_by INT NOT NULL,
  acknowledged_by INT,
  acknowledged_date DATE,
  employee_response TEXT,
  hr_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id),
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id),
  FOREIGN KEY (issued_by) REFERENCES authentication(id),
  FOREIGN KEY (acknowledged_by) REFERENCES authentication(id)
);

-- Track consecutive ratings for sanctions
CREATE TABLE IF NOT EXISTS spms_rating_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  cycle_id INT NOT NULL,
  ipcr_id INT NOT NULL,
  final_rating DECIMAL(3,2),
  adjectival_rating VARCHAR(20),
  is_unsatisfactory BOOLEAN DEFAULT FALSE,
  is_poor BOOLEAN DEFAULT FALSE,
  consecutive_unsatisfactory INT DEFAULT 0,
  consecutive_poor INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id),
  FOREIGN KEY (cycle_id) REFERENCES spms_cycles(id),
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id),
  UNIQUE KEY unique_emp_cycle (employee_id, cycle_id)
);

-- =====================================================
-- MODIFY EXISTING TABLES
-- =====================================================

-- Add OPCR link and appeal flag to IPCR
ALTER TABLE spms_ipcr ADD COLUMN opcr_id INT;
ALTER TABLE spms_ipcr ADD COLUMN appeal_filed BOOLEAN DEFAULT FALSE;
ALTER TABLE spms_ipcr ADD COLUMN appeal_id INT;
ALTER TABLE spms_ipcr ADD COLUMN opcr_ceiling_rating DECIMAL(3,2);

-- Add foreign key if not exists (MySQL 8.0+)
-- Note: Run these separately if ALTER fails
-- ALTER TABLE spms_ipcr ADD FOREIGN KEY (opcr_id) REFERENCES spms_opcr(id);

-- Link development plans to IPCR for auto-generation
ALTER TABLE spms_development_plans ADD COLUMN ipcr_id INT;
ALTER TABLE spms_development_plans ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE spms_development_plans ADD COLUMN trigger_reason VARCHAR(100);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View: Department Performance Summary
CREATE OR REPLACE VIEW v_department_performance AS
SELECT 
  o.department,
  o.cycle_id,
  c.title as cycle_title,
  c.year,
  c.period,
  o.final_rating as opcr_rating,
  o.adjectival_rating as opcr_adjectival,
  o.status as opcr_status,
  COUNT(DISTINCT i.id) as total_ipcrs,
  AVG(i.final_average_rating) as avg_ipcr_rating,
  SUM(CASE WHEN i.final_average_rating >= 4.50 THEN 1 ELSE 0 END) as outstanding_count,
  SUM(CASE WHEN i.final_average_rating >= 3.50 AND i.final_average_rating < 4.50 THEN 1 ELSE 0 END) as very_satisfactory_count,
  SUM(CASE WHEN i.final_average_rating >= 2.50 AND i.final_average_rating < 3.50 THEN 1 ELSE 0 END) as satisfactory_count,
  SUM(CASE WHEN i.final_average_rating >= 1.50 AND i.final_average_rating < 2.50 THEN 1 ELSE 0 END) as unsatisfactory_count,
  SUM(CASE WHEN i.final_average_rating < 1.50 THEN 1 ELSE 0 END) as poor_count
FROM spms_opcr o
JOIN spms_cycles c ON o.cycle_id = c.id
LEFT JOIN authentication e ON e.department = o.department
LEFT JOIN spms_ipcr i ON i.employee_id = e.id AND i.cycle_id = o.cycle_id
GROUP BY o.department, o.cycle_id, c.title, c.year, c.period, o.final_rating, o.adjectival_rating, o.status;

-- View: Employees requiring development intervention
CREATE OR REPLACE VIEW v_employees_needing_intervention AS
SELECT 
  e.id as employee_id,
  CONCAT(e.first_name, ' ', e.last_name) as employee_name,
  e.department,
  e.job_title,
  i.id as ipcr_id,
  c.title as cycle_title,
  i.final_average_rating as final_rating,
  CASE 
    WHEN i.final_average_rating >= 4.50 THEN 'Outstanding'
    WHEN i.final_average_rating >= 3.50 THEN 'Very Satisfactory'
    WHEN i.final_average_rating >= 2.50 THEN 'Satisfactory'
    WHEN i.final_average_rating >= 1.50 THEN 'Unsatisfactory'
    ELSE 'Poor'
  END as adjectival_rating,
  rh.consecutive_unsatisfactory,
  rh.consecutive_poor,
  CASE 
    WHEN rh.consecutive_poor >= 1 THEN 'Separation Risk'
    WHEN rh.consecutive_unsatisfactory >= 2 THEN 'Final Warning'
    WHEN rh.consecutive_unsatisfactory >= 1 THEN 'Development Required'
    ELSE 'Monitor'
  END as intervention_level
FROM spms_ipcr i
JOIN authentication e ON i.employee_id = e.id
JOIN spms_cycles c ON i.cycle_id = c.id
LEFT JOIN spms_rating_history rh ON rh.ipcr_id = i.id
WHERE i.final_average_rating < 2.50
  AND i.status = 'Finalized';

-- =====================================================
-- INSERT DEFAULT PMT ROLES (Optional)
-- =====================================================

-- You can customize these based on your organizational structure
-- INSERT INTO spms_pmt_members (employee_id, role, designation, office) VALUES
-- (1, 'Chairperson', 'City Administrator', 'Office of the City Administrator'),
-- (2, 'Member', 'HRMO III', 'City Human Resource Management Office');
