
CREATE TABLE IF NOT EXISTS tranche_allowances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tranche_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    amount DECIMAL(10, 2) NULL, -- For fixed amounts like PERA
    is_matrix BOOLEAN DEFAULT FALSE, -- If true, look at values table
    category ENUM('Monthly', 'Annual', 'Bonus') DEFAULT 'Monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tranche_id) REFERENCES salary_tranches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tranche_allowance_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    allowance_id INT NOT NULL,
    condition_key VARCHAR(255) NOT NULL, -- e.g. "Mayor", "SG 20", "SG 19 & Below"
    amount DECIMAL(10, 2) NOT NULL,
    value_type ENUM('FIXED', 'PERCENTAGE') DEFAULT 'FIXED', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (allowance_id) REFERENCES tranche_allowances(id) ON DELETE CASCADE
);
