-- Add columns to authentication table for enhanced employee management
-- We use a stored procedure to check if columns exist before adding them to avoid errors on re-runs
DROP PROCEDURE IF EXISTS UpgradeEmployeeSchema;

DELIMITER $$

CREATE PROCEDURE UpgradeEmployeeSchema()
BEGIN
    -- Add job_title if not exists
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'authentication' AND COLUMN_NAME = 'job_title') THEN
        ALTER TABLE authentication ADD COLUMN job_title VARCHAR(100);
    END IF;

    -- Add employment_status if not exists
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'authentication' AND COLUMN_NAME = 'employment_status') THEN
        ALTER TABLE authentication ADD COLUMN employment_status ENUM('Active', 'Probationary', 'Terminated', 'Resigned', 'On Leave') DEFAULT 'Active';
    END IF;

    -- Add date_hired if not exists
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'authentication' AND COLUMN_NAME = 'date_hired') THEN
        ALTER TABLE authentication ADD COLUMN date_hired DATE;
    END IF;

    -- Add manager_id if not exists
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'authentication' AND COLUMN_NAME = 'manager_id') THEN
        ALTER TABLE authentication ADD COLUMN manager_id INT;
        ALTER TABLE authentication ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES authentication(id) ON DELETE SET NULL;
    -- END IF;
END $$

DELIMITER ;

CALL UpgradeEmployeeSchema();
DROP PROCEDURE UpgradeEmployeeSchema;

-- Performance Evaluation Tables

CREATE TABLE IF NOT EXISTS performance_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General', -- e.g., Core Values, Technical Skills
  weight DECIMAL(5, 2) DEFAULT 1.0, -- Weighting factor
  max_score INT DEFAULT 5, -- e.g., 1-5 scale
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL, -- The employee being reviewed
  reviewer_id INT NOT NULL, -- The person doing the review
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  status ENUM('Draft', 'Submitted', 'Acknowledged', 'Finalized') DEFAULT 'Draft',
  total_score DECIMAL(5, 2),
  overall_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES authentication(id),
  FOREIGN KEY (reviewer_id) REFERENCES authentication(id)
);

CREATE TABLE IF NOT EXISTS performance_review_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  criteria_id INT NOT NULL,
  score DECIMAL(5, 2),
  comment TEXT,
  FOREIGN KEY (review_id) REFERENCES performance_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (criteria_id) REFERENCES performance_criteria(id)
);
