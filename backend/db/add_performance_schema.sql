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