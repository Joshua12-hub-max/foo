-- Add missing columns to schedules table for enhanced schedule management

ALTER TABLE schedules 
ADD COLUMN schedule_title VARCHAR(255) DEFAULT 'Regular Shift' AFTER day_of_week,
ADD COLUMN start_date DATE AFTER schedule_title,
ADD COLUMN end_date DATE AFTER start_date,
ADD COLUMN repeat_pattern VARCHAR(50) DEFAULT 'none' AFTER end_date;
