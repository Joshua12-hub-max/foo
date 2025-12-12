-- Full Recruitment Tables Schema (run this to create all tables)
-- Database: chrmo_db

-- 1. Job Postings Table
CREATE TABLE IF NOT EXISTS recruitment_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  job_description TEXT NOT NULL,
  requirements TEXT,
  salary_range VARCHAR(100),
  location VARCHAR(100) DEFAULT 'Main Office',
  employment_type ENUM('Full-time', 'Part-time', 'Contractual', 'Job Order') DEFAULT 'Full-time',
  status ENUM('Open', 'Closed', 'On Hold') DEFAULT 'Open',
  posted_by INT,
  posted_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Applicants Table (Linked to Jobs)
CREATE TABLE IF NOT EXISTS recruitment_applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  resume_path VARCHAR(255),
  
  -- Kanban Stages
  stage ENUM('Applied', 'Initial Interview', 'Final Interview', 'Hired', 'Rejected') DEFAULT 'Applied',
  
  -- Interview Details
  interview_date DATETIME,
  interview_type ENUM('Google Meet', 'Zoom', 'Face to Face', 'Phone') DEFAULT 'Google Meet',
  interview_link VARCHAR(255),
  interview_notes TEXT,
  
  -- Hiring Details
  hired_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES recruitment_jobs(id) ON DELETE CASCADE
);
