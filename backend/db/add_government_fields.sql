-- Government Worker Fields Migration
-- Adds Philippine government employee information fields to authentication table

-- Personal Information
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS gender ENUM('Male', 'Female') DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS civil_status ENUM('Single', 'Married', 'Widowed', 'Separated', 'Annulled') DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'Filipino';
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) DEFAULT NULL;

-- Contact Information  
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS permanent_address TEXT DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(20) DEFAULT NULL;

-- Government IDs
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS sss_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS philhealth_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS pagibig_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS tin_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS gsis_number VARCHAR(20) DEFAULT NULL;

-- Employment Details (Government-specific)
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(10) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS step_increment INT DEFAULT 1;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS appointment_type ENUM('Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary') DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS office_address TEXT DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS station VARCHAR(100) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS position_title VARCHAR(100) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS item_number VARCHAR(50) DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS first_day_of_service DATE DEFAULT NULL;
ALTER TABLE authentication ADD COLUMN IF NOT EXISTS supervisor VARCHAR(100) DEFAULT NULL;

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_auth_sss ON authentication(sss_number);
CREATE INDEX IF NOT EXISTS idx_auth_philhealth ON authentication(philhealth_number);
CREATE INDEX IF NOT EXISTS idx_auth_tin ON authentication(tin_number);
CREATE INDEX IF NOT EXISTS idx_auth_gsis ON authentication(gsis_number);
