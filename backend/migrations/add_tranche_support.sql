-- Migration: Add tranche column to salary_schedule table
-- This allows storing different salary amounts for each tranche (1st, 2nd, 3rd, 4th)

-- Add tranche column if it doesn't exist
ALTER TABLE salary_schedule ADD COLUMN IF NOT EXISTS tranche INT NOT NULL DEFAULT 2;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_salary_schedule_tranche ON salary_schedule(tranche);

-- Update existing records to be tranche 2 (Second Tranche - current active)
UPDATE salary_schedule SET tranche = 2 WHERE tranche IS NULL OR tranche = 0;

-- Create tranches settings table
CREATE TABLE IF NOT EXISTS salary_tranches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tranche_number INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    circular_number VARCHAR(100),
    effective_date DATE,
    date_issued DATE,
    applicable_to VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default tranches
INSERT IGNORE INTO salary_tranches (tranche_number, name, circular_number, effective_date, date_issued, applicable_to, is_active) VALUES
(1, 'First Tranche', 'LBC No. 160', '2024-01-01', '2023-12-15', 'All Local Government Units', FALSE),
(2, 'Second Tranche', 'LBC No. 165', '2025-08-01', '2025-07-18', 'Special Cities and First Class Provinces and Cities', TRUE),
(3, 'Third Tranche', 'LBC No. 170', '2026-01-01', '2025-12-15', 'All Local Government Units', FALSE),
(4, 'Fourth Tranche', 'LBC No. 175', '2027-01-01', '2026-12-15', 'All Local Government Units', FALSE);
