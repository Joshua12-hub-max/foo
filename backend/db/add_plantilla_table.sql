CREATE TABLE IF NOT EXISTS plantilla_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_number VARCHAR(50) UNIQUE NOT NULL,
  position_title VARCHAR(100) NOT NULL,
  salary_grade INT NOT NULL,
  step_increment INT DEFAULT 1,
  department VARCHAR(100),
  is_vacant BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
