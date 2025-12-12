-- Migration: Add attachment_path column to undertime_requests table
-- Run this script to add file attachment support to undertime requests

ALTER TABLE undertime_requests 
ADD COLUMN attachment_path VARCHAR(255) NULL AFTER reason;
