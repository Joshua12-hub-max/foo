-- =====================================================
-- SPMS (Strategic Performance Management System) Schema
-- Based on Philippine CSC Guidelines
-- =====================================================

-- 1. Review Cycles (Rating Periods)
CREATE TABLE IF NOT EXISTS spms_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  period ENUM('First Semester', 'Second Semester', 'Annual') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Planning', 'Active', 'Evaluation', 'Closed') DEFAULT 'Planning',
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES authentication(id)
);

-- 2. Major Final Outputs (Office/Department Level)
CREATE TABLE IF NOT EXISTS spms_mfo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Key Result Areas (Under MFO)
CREATE TABLE IF NOT EXISTS spms_kra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mfo_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) DEFAULT 20.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mfo_id) REFERENCES spms_mfo(id) ON DELETE CASCADE
);

-- 4. Success Indicators Template (Reusable indicators)
CREATE TABLE IF NOT EXISTS spms_success_indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kra_id INT NOT NULL,
  description TEXT NOT NULL,
  target_quality TEXT,
  target_efficiency TEXT,
  target_timeliness TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kra_id) REFERENCES spms_kra(id) ON DELETE CASCADE
);

-- 5. Core Competencies (Behavioral Indicators)
CREATE TABLE IF NOT EXISTS spms_competencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('Core', 'Organizational', 'Leadership', 'Technical') DEFAULT 'Core',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Core Competencies (CSC Standard)
INSERT INTO spms_competencies (name, description, category) VALUES
('Integrity', 'Demonstrates ethical behavior, honesty, and adherence to moral principles', 'Core'),
('Professionalism', 'Exhibits professional conduct, work ethic, and commitment to service', 'Core'),
('Teamwork', 'Works collaboratively with others to achieve common goals', 'Core'),
('Service Excellence', 'Delivers quality service and exceeds stakeholder expectations', 'Core'),
('Innovation', 'Demonstrates creativity and initiative in improving work processes', 'Core'),
('Communication', 'Effectively conveys information and ideas', 'Organizational'),
('Problem Solving', 'Identifies issues and develops effective solutions', 'Organizational'),
('Planning and Organizing', 'Sets priorities and manages time effectively', 'Organizational'),
('Leadership', 'Guides and motivates others towards achieving goals', 'Leadership'),
('Decision Making', 'Makes sound and timely decisions', 'Leadership');

-- 6. IPCR (Individual Performance Commitment and Review)
CREATE TABLE IF NOT EXISTS spms_ipcr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  rater_id INT NOT NULL,
  approver_id INT,
  cycle_id INT NOT NULL,
  status ENUM('Draft', 'Committed', 'For Rating', 'Rated', 'Acknowledged', 'Approved', 'Final') DEFAULT 'Draft',
  date_committed DATE,
  date_submitted DATE,
  date_rated DATE,
  date_acknowledged DATE,
  date_approved DATE,
  final_average_rating DECIMAL(4,2),
  adjectival_rating ENUM('Outstanding', 'Very Satisfactory', 'Satisfactory', 'Unsatisfactory', 'Poor'),
  employee_remarks TEXT,
  rater_remarks TEXT,
  approver_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id),
  FOREIGN KEY (rater_id) REFERENCES authentication(id),
  FOREIGN KEY (approver_id) REFERENCES authentication(id),
  FOREIGN KEY (cycle_id) REFERENCES spms_cycles(id)
);

-- 7. IPCR Items (Individual Outputs and Targets)
CREATE TABLE IF NOT EXISTS spms_ipcr_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ipcr_id INT NOT NULL,
  kra_id INT,
  output_description TEXT NOT NULL,
  success_indicator TEXT NOT NULL,
  target TEXT,
  weight DECIMAL(5,2) DEFAULT 10.00,
  accomplishment TEXT,
  rating_quality DECIMAL(3,2),
  rating_efficiency DECIMAL(3,2),
  rating_timeliness DECIMAL(3,2),
  average_rating DECIMAL(4,2),
  remarks TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id) ON DELETE CASCADE,
  FOREIGN KEY (kra_id) REFERENCES spms_kra(id) ON DELETE SET NULL
);

-- 8. IPCR Competency Ratings
CREATE TABLE IF NOT EXISTS spms_ipcr_competencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ipcr_id INT NOT NULL,
  competency_id INT NOT NULL,
  self_rating DECIMAL(3,2),
  supervisor_rating DECIMAL(3,2),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES spms_competencies(id)
);

-- 9. IPCR Activity Log (Audit Trail)
CREATE TABLE IF NOT EXISTS spms_ipcr_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ipcr_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  performed_by INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ipcr_id) REFERENCES spms_ipcr(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES authentication(id)
);

-- Create indexes for performance
CREATE INDEX idx_ipcr_employee ON spms_ipcr(employee_id);
CREATE INDEX idx_ipcr_cycle ON spms_ipcr(cycle_id);
CREATE INDEX idx_ipcr_status ON spms_ipcr(status);
CREATE INDEX idx_ipcr_items_ipcr ON spms_ipcr_items(ipcr_id);
