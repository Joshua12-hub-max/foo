-- Add employment_type column to recruitment_jobs table
ALTER TABLE recruitment_jobs 
ADD COLUMN IF NOT EXISTS employment_type ENUM('Full-time', 'Part-time', 'Contractual', 'Job Order') DEFAULT 'Full-time' 
AFTER location;
