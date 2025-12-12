CREATE TABLE IF NOT EXISTS performance_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Upcoming', 'Active', 'Completed', 'Closed') DEFAULT 'Upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE performance_reviews ADD COLUMN cycle_id INT;
ALTER TABLE performance_reviews ADD CONSTRAINT fk_review_cycle FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE SET NULL;
