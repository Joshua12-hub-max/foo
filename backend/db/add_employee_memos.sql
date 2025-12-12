-- Employee Memos Migration
-- For Disciplinary Memos and Administrative Notices

CREATE TABLE IF NOT EXISTS employee_memos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    memo_number VARCHAR(50) NOT NULL UNIQUE,
    employee_id INT NOT NULL,
    author_id INT NOT NULL,
    memo_type ENUM('Verbal Warning', 'Written Warning', 'Suspension Notice', 'Termination Notice', 'Show Cause') NOT NULL DEFAULT 'Written Warning',
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('Low', 'Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
    effective_date DATE,
    acknowledgment_required BOOLEAN DEFAULT FALSE,
    acknowledged_at DATETIME DEFAULT NULL,
    status ENUM('Draft', 'Sent', 'Acknowledged', 'Archived') NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authentication(id) ON DELETE CASCADE,
    INDEX idx_memo_employee (employee_id),
    INDEX idx_memo_type (memo_type),
    INDEX idx_memo_status (status)
);

-- Add memo_number sequence tracking
CREATE TABLE IF NOT EXISTS memo_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    UNIQUE KEY unique_year (year)
);