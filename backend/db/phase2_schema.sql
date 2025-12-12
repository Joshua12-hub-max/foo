-- Phase 2 Schema: Employee Profiling, Department Enhancement, Performance System

-- 1. Employee Skills & Competencies
CREATE TABLE IF NOT EXISTS employee_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'Technical', -- Technical, Soft Skill, Language, etc.
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
  years_experience DECIMAL(4, 1),
  endorsements INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
);

-- 2. Employee Education & Certifications
CREATE TABLE IF NOT EXISTS employee_education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  type ENUM('Education', 'Certification', 'Training') DEFAULT 'Education',
  expiry_date DATE, -- For certifications
  credential_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
);

-- 3. Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50), -- Contract, ID, Resume, etc.
  file_path VARCHAR(255) NOT NULL,
  file_size INT, -- in bytes
  mime_type VARCHAR(100),
  uploaded_by INT, -- Admin ID who uploaded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES authentication(id) ON DELETE SET NULL
);

-- 4. Employee Emergency Contacts
CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
);

-- 5. Employee Employment History (Internal/External)
CREATE TABLE IF NOT EXISTS employee_employment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL, -- 'Internal' for internal history
  job_title VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
);

-- 6. Employee Notes (Admin Only)
CREATE TABLE IF NOT EXISTS employee_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  author_id INT NOT NULL,
  note_content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General', -- General, Disciplinary, Achievement
  is_private BOOLEAN DEFAULT TRUE, -- Only visible to admins
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES authentication(id) ON DELETE CASCADE
);

-- 7. Performance Review Cycles
CREATE TABLE IF NOT EXISTS performance_review_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL, -- e.g., "2025 Annual Review"
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Draft', 'Active', 'Completed', 'Archived') DEFAULT 'Draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES authentication(id) ON DELETE SET NULL
);

-- 8. Performance Goals
CREATE TABLE IF NOT EXISTS performance_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  review_cycle_id INT, -- Optional linkage to a cycle
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metric VARCHAR(255), -- How it's measured
  target_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2) DEFAULT 0,
  weight DECIMAL(5, 2) DEFAULT 1.0,
  start_date DATE,
  due_date DATE,
  status ENUM('Not Started', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Not Started',
  progress INT DEFAULT 0, -- 0-100 percentage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (review_cycle_id) REFERENCES performance_review_cycles(id) ON DELETE SET NULL
);

-- 9. Performance Review Templates (Optional enhancement for dynamic forms)
CREATE TABLE IF NOT EXISTS performance_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sections JSON, -- Storing form structure as JSON for flexibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Performance Improvement Plans (PIP)
CREATE TABLE IF NOT EXISTS performance_improvement_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  supervisor_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  areas_of_concern TEXT NOT NULL,
  action_plan TEXT NOT NULL,
  status ENUM('Active', 'Completed', 'Failed', 'Terminated') DEFAULT 'Active',
  outcome_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES authentication(id) ON DELETE CASCADE
);

-- Add link to Review Cycle in Performance Reviews table
-- ALTER TABLE performance_reviews ADD COLUMN review_cycle_id INT;
-- ALTER TABLE performance_reviews ADD CONSTRAINT fk_review_cycle FOREIGN KEY (review_cycle_id) REFERENCES performance_review_cycles(id) ON DELETE SET NULL;
