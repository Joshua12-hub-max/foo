-- CSC-Compliant Performance Evaluation Enhancement
-- Adds support for self-rating, multi-level approval, audit trails, and transparency

-- 1. Enhance performance_reviews table
ALTER TABLE performance_reviews
  ADD COLUMN self_rating_score DECIMAL(5, 2) DEFAULT NULL COMMENT 'Employee self-assessment score',
  ADD COLUMN supervisor_rating_score DECIMAL(5, 2) DEFAULT NULL COMMENT 'Supervisor rating score',
  ADD COLUMN final_rating_score DECIMAL(5, 2) DEFAULT NULL COMMENT 'Final approved rating',
  ADD COLUMN self_rating_status ENUM('pending', 'submitted') DEFAULT 'pending',
  ADD COLUMN supervisor_remarks TEXT DEFAULT NULL,
  ADD COLUMN employee_remarks TEXT DEFAULT NULL,
  ADD COLUMN head_remarks TEXT DEFAULT NULL,
  ADD COLUMN approved_by INT DEFAULT NULL,
  ADD COLUMN approved_at TIMESTAMP DEFAULT NULL,
  ADD COLUMN disagreed BOOLEAN DEFAULT FALSE COMMENT 'Employee disagreed with rating',
  ADD COLUMN disagree_remarks TEXT DEFAULT NULL,
  ADD COLUMN rating_period ENUM('1st_sem', '2nd_sem', 'annual') DEFAULT 'annual',
  ADD FOREIGN KEY (approved_by) REFERENCES authentication(id);

-- 2. Modify status enum to include more states
ALTER TABLE performance_reviews 
  MODIFY COLUMN status ENUM('Draft', 'Self-Rated', 'Submitted', 'Acknowledged', 'Approved', 'Finalized') DEFAULT 'Draft';

-- 3. Enhance performance_criteria table
ALTER TABLE performance_criteria
  ADD COLUMN criteria_type ENUM('core_function', 'support_function', 'core_competency', 'organizational_competency') DEFAULT 'core_function',
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- 4. Add self-rating to performance_review_items
ALTER TABLE performance_review_items
  ADD COLUMN self_score DECIMAL(5, 2) DEFAULT NULL COMMENT 'Employee self-rating for this criteria',
  ADD COLUMN actual_accomplishments TEXT DEFAULT NULL COMMENT 'Employee actual accomplishments';

-- 5. Create audit log table for full transparency
CREATE TABLE IF NOT EXISTS performance_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  action VARCHAR(100) NOT NULL COMMENT 'Action performed: created, self_rated, supervisor_rated, submitted, acknowledged, approved, disagreed',
  actor_id INT NOT NULL COMMENT 'User who performed the action',
  details TEXT DEFAULT NULL COMMENT 'JSON details of the action',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES performance_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES authentication(id),
  INDEX idx_review_id (review_id),
  INDEX idx_actor_id (actor_id),
  INDEX idx_action (action)
);

-- 6. Add review cycle rating period
ALTER TABLE review_cycles
  ADD COLUMN rating_period ENUM('1st_sem', '2nd_sem', 'annual') DEFAULT 'annual',
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
