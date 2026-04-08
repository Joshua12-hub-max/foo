CREATE TABLE `applicant_education` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicant_id` int NOT NULL,
	`level` enum('Elementary','Secondary','Vocational','College','Graduate Studies') NOT NULL,
	`school_name` varchar(255) NOT NULL,
	`degree_course` varchar(255),
	`year_graduated` varchar(10),
	`units_earned` varchar(50),
	`date_from` varchar(20),
	`date_to` varchar(20),
	`honors` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `applicant_education_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applicant_eligibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicant_id` int NOT NULL,
	`eligibility_name` varchar(255) NOT NULL,
	`rating` decimal(5,2),
	`exam_date` varchar(20),
	`exam_place` varchar(255),
	`license_number` varchar(50),
	`validity_date` varchar(20),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `applicant_eligibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applicant_experience` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicant_id` int NOT NULL,
	`date_from` varchar(20) NOT NULL,
	`date_to` varchar(20),
	`position_title` varchar(255) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`monthly_salary` decimal(12,2),
	`salary_grade` varchar(20),
	`appointment_status` varchar(50),
	`is_government` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `applicant_experience_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applicant_training` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicant_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`date_from` varchar(20),
	`date_to` varchar(20),
	`hours_number` int,
	`type_of_ld` varchar(50),
	`conducted_by` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `applicant_training_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `employee_education`;--> statement-breakpoint
DROP TABLE `employee_employment_history`;--> statement-breakpoint
ALTER TABLE `employee_memos` DROP INDEX `memo_number`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `umid_no_unique`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `philsys_id_unique`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `philhealth_no_unique`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `pagibig_no_unique`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `tin_no_unique`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `gsis_no_unique`;--> statement-breakpoint
DROP INDEX `employee_id` ON `employee_custom_fields`;--> statement-breakpoint
DROP INDEX `employee_id` ON `employee_documents`;--> statement-breakpoint
DROP INDEX `uploaded_by` ON `employee_documents`;--> statement-breakpoint
DROP INDEX `employee_id` ON `employee_emergency_contacts`;--> statement-breakpoint
DROP INDEX `author_id` ON `employee_memos`;--> statement-breakpoint
DROP INDEX `idx_memo_employee` ON `employee_memos`;--> statement-breakpoint
DROP INDEX `idx_memo_type` ON `employee_memos`;--> statement-breakpoint
DROP INDEX `idx_memo_status` ON `employee_memos`;--> statement-breakpoint
DROP INDEX `employee_id` ON `employee_notes`;--> statement-breakpoint
DROP INDEX `author_id` ON `employee_notes`;--> statement-breakpoint
DROP INDEX `employee_id` ON `employee_skills`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_declarations`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_education`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_eligibility`;--> statement-breakpoint
DROP INDEX `idx_emp` ON `pds_family`;--> statement-breakpoint
DROP INDEX `idx_hr_employee_id` ON `pds_hr_details`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_learning_development`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_other_info`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_personal_information`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_references`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_voluntary_work`;--> statement-breakpoint
DROP INDEX `employee_id` ON `pds_work_experience`;--> statement-breakpoint
DROP INDEX `idx_employee` ON `service_records`;--> statement-breakpoint
DROP INDEX `idx_event_type` ON `service_records`;--> statement-breakpoint
DROP INDEX `idx_event_date` ON `service_records`;--> statement-breakpoint
ALTER TABLE `authentication` MODIFY COLUMN `suffix` varchar(100);--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `related_third_degree` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `related_third_degree` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `related_fourth_degree` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `related_fourth_degree` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `found_guilty_admin` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `found_guilty_admin` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `criminally_charged` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `criminally_charged` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `convicted_crime` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `convicted_crime` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `separated_from_service` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `separated_from_service` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `election_candidate` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `election_candidate` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `resigned_to_promote` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `resigned_to_promote` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `immigrant_status` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `immigrant_status` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `indigenous_member` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `indigenous_member` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `person_with_disability` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `person_with_disability` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `solo_parent` boolean;--> statement-breakpoint
ALTER TABLE `pds_declarations` MODIFY COLUMN `solo_parent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pds_education` MODIFY COLUMN `date_from` varchar(4);--> statement-breakpoint
ALTER TABLE `pds_education` MODIFY COLUMN `date_to` varchar(4);--> statement-breakpoint
ALTER TABLE `pds_family` MODIFY COLUMN `name_extension` varchar(50);--> statement-breakpoint
ALTER TABLE `pds_family` MODIFY COLUMN `occupation` varchar(150);--> statement-breakpoint
ALTER TABLE `pds_family` MODIFY COLUMN `employer` varchar(255);--> statement-breakpoint
ALTER TABLE `pds_learning_development` MODIFY COLUMN `title` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `pds_other_info` MODIFY COLUMN `description` text NOT NULL;--> statement-breakpoint
ALTER TABLE `pds_personal_information` MODIFY COLUMN `gender` varchar(50);--> statement-breakpoint
ALTER TABLE `pds_personal_information` MODIFY COLUMN `civil_status` varchar(50);--> statement-breakpoint
ALTER TABLE `pds_personal_information` MODIFY COLUMN `blood_type` varchar(10);--> statement-breakpoint
ALTER TABLE `pds_personal_information` MODIFY COLUMN `residential_zip_code` varchar(10);--> statement-breakpoint
ALTER TABLE `pds_personal_information` MODIFY COLUMN `permanent_zip_code` varchar(10);--> statement-breakpoint
ALTER TABLE `pds_work_experience` MODIFY COLUMN `date_to` varchar(20);--> statement-breakpoint
ALTER TABLE `service_records` MODIFY COLUMN `employee_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `telephone_number` varchar(20);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `facebook_url` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `linkedin_url` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `twitter_handle` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `agency_employee_no` varchar(50);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `nationality` varchar(100) DEFAULT 'Filipino';--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `citizenship_type` varchar(50);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `dual_country` varchar(100);--> statement-breakpoint
ALTER TABLE `pds_education` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_eligibility` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_family` ADD `mobile_no` varchar(50);--> statement-breakpoint
ALTER TABLE `pds_family` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_learning_development` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_other_info` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD `religion` varchar(100);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD `nationality` varchar(100) DEFAULT 'Filipino';--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD `umid_number` varchar(50);--> statement-breakpoint
ALTER TABLE `pds_references` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_voluntary_work` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pds_work_experience` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notifications` ADD `link` varchar(255);--> statement-breakpoint
ALTER TABLE `notifications` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `employee_memos` ADD CONSTRAINT `uq_memo_number` UNIQUE(`memo_number`);--> statement-breakpoint
ALTER TABLE `pds_hr_details` ADD CONSTRAINT `uq_pds_hr_employee_id` UNIQUE(`employee_id`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_pi_employee_id` UNIQUE(`employee_id`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_gsis_number` UNIQUE(`gsis_number`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_pagibig_number` UNIQUE(`pagibig_number`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_philhealth_number` UNIQUE(`philhealth_number`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_tin_number` UNIQUE(`tin_number`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_umid_number` UNIQUE(`umid_number`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_philsys_id` UNIQUE(`philsys_id`);--> statement-breakpoint
ALTER TABLE `applicant_education` ADD CONSTRAINT `applicant_education_applicant_id_recruitment_applicants_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `recruitment_applicants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicant_eligibility` ADD CONSTRAINT `applicant_eligibility_applicant_id_recruitment_applicants_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `recruitment_applicants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicant_experience` ADD CONSTRAINT `applicant_experience_applicant_id_recruitment_applicants_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `recruitment_applicants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicant_training` ADD CONSTRAINT `applicant_training_applicant_id_recruitment_applicants_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `recruitment_applicants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_app_edu_id` ON `applicant_education` (`applicant_id`);--> statement-breakpoint
CREATE INDEX `idx_app_elig_id` ON `applicant_eligibility` (`applicant_id`);--> statement-breakpoint
CREATE INDEX `idx_app_exp_id` ON `applicant_experience` (`applicant_id`);--> statement-breakpoint
CREATE INDEX `idx_app_train_id` ON `applicant_training` (`applicant_id`);--> statement-breakpoint
ALTER TABLE `service_records` ADD CONSTRAINT `service_records_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ecf_employee_id` ON `employee_custom_fields` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_ed_employee_id` ON `employee_documents` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_ed_uploaded_by` ON `employee_documents` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `idx_eec_employee_id` ON `employee_emergency_contacts` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_em_author_id` ON `employee_memos` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_em_employee_id` ON `employee_memos` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_em_memo_type` ON `employee_memos` (`memo_type`);--> statement-breakpoint
CREATE INDEX `idx_em_status` ON `employee_memos` (`status`);--> statement-breakpoint
CREATE INDEX `idx_en_employee_id` ON `employee_notes` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_en_author_id` ON `employee_notes` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_es_employee_id` ON `employee_skills` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_decl_employee_id` ON `pds_declarations` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_edu_employee_id` ON `pds_education` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_elig_employee_id` ON `pds_eligibility` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_fam_employee_id` ON `pds_family` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_hr_employee_id` ON `pds_hr_details` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_ld_employee_id` ON `pds_learning_development` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_oi_employee_id` ON `pds_other_info` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_pi_employee_id` ON `pds_personal_information` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_ref_employee_id` ON `pds_references` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_vw_employee_id` ON `pds_voluntary_work` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_pds_we_employee_id` ON `pds_work_experience` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_sr_employee_id` ON `service_records` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_sr_event_type` ON `service_records` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_sr_event_date` ON `service_records` (`event_date`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` DROP COLUMN `voluntary_work`;--> statement-breakpoint
ALTER TABLE `pds_hr_details` DROP COLUMN `employment_type`;--> statement-breakpoint
ALTER TABLE `pds_hr_details` DROP COLUMN `religion`;--> statement-breakpoint
ALTER TABLE `pds_hr_details` DROP COLUMN `barangay`;--> statement-breakpoint
ALTER TABLE `pds_hr_details` DROP COLUMN `facebook_url`;--> statement-breakpoint
ALTER TABLE `pds_hr_details` DROP COLUMN `linkedin_url`;--> statement-breakpoint
ALTER TABLE `pds_hr_details` DROP COLUMN `twitter_handle`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `residential_address`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `permanent_address`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `umid_no`;