-- Migrate bio_enrolled_users
ALTER TABLE bio_enrolled_users MODIFY COLUMN employee_id VARCHAR(50) NOT NULL;

-- Migrate bio_attendance_logs
ALTER TABLE bio_attendance_logs MODIFY COLUMN employee_id VARCHAR(50) NOT NULL;

-- Reformat existing data in bio_enrolled_users
UPDATE bio_enrolled_users 
SET employee_id = CONCAT('Emp-', LPAD(employee_id, 3, '0'))
WHERE employee_id REGEXP '^[0-9]+$';

-- Reformat existing data in bio_attendance_logs
UPDATE bio_attendance_logs 
SET employee_id = CONCAT('Emp-', LPAD(employee_id, 3, '0'))
WHERE employee_id REGEXP '^[0-9]+$';
