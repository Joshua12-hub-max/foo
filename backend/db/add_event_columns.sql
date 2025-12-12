-- Migration: Add start_date, end_date, and department columns to events table
-- Run this migration to add date range and department support for events

ALTER TABLE events 
ADD COLUMN start_date DATE AFTER date,
ADD COLUMN end_date DATE AFTER start_date,
ADD COLUMN department VARCHAR(100) DEFAULT NULL AFTER end_date;

-- Migrate existing data: copy date to start_date and end_date
UPDATE events SET start_date = date, end_date = date WHERE start_date IS NULL;

-- Verify migration
SELECT id, title, date, start_date, end_date, department FROM events LIMIT 10;
