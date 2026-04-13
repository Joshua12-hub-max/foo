-- Add SSS Number column to PDS Personal Information table
-- This field was missing from the original schema despite being part of CS Form 212

ALTER TABLE `pds_personal_information`
ADD COLUMN `sss_number` VARCHAR(50) NULL AFTER `philhealth_number`,
ADD UNIQUE INDEX `uq_pds_sss_number` (`sss_number`);
