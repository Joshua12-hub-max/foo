CREATE TABLE IF NOT EXISTS `accrual_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`days_present` decimal(10,3) NOT NULL,
	`earned_credits` decimal(10,3) NOT NULL,
	`rule_type` varchar(50) DEFAULT 'CSC_STANDARD',
	CONSTRAINT `accrual_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_rule` UNIQUE(`days_present`,`rule_type`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pds_declarations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`related_third_degree` varchar(10),
	`related_third_details` text,
	`related_fourth_degree` varchar(10),
	`related_fourth_details` text,
	`found_guilty_admin` varchar(10),
	`found_guilty_details` text,
	`criminally_charged` varchar(10),
	`date_filed` date,
	`status_of_case` varchar(255),
	`convicted_crime` varchar(10),
	`convicted_details` text,
	`separated_from_service` varchar(10),
	`separated_details` text,
	`election_candidate` varchar(10),
	`election_details` text,
	`resigned_to_promote` varchar(10),
	`resigned_details` text,
	`immigrant_status` varchar(10),
	`immigrant_details` text,
	`indigenous_member` varchar(10),
	`indigenous_details` text,
	`person_with_disability` varchar(10),
	`disability_id_no` varchar(100),
	`solo_parent` varchar(10),
	`solo_parent_id_no` varchar(100),
	`govt_id_type` varchar(100),
	`govt_id_no` varchar(100),
	`govt_id_issuance` varchar(255),
	`date_accomplished` date,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pds_declarations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pds_hr_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`employment_status` enum('Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause') DEFAULT 'Active',
	`employment_type` varchar(50) DEFAULT 'Probationary',
	`appointment_type` enum('Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS'),
	`job_title` varchar(100),
	`position_title` varchar(100),
	`item_number` varchar(50),
	`station` varchar(100),
	`office_address` text,
	`department_id` int,
	`position_id` int,
	`manager_id` int,
	`salary_grade` varchar(10),
	`step_increment` int DEFAULT 1,
	`salary_basis` enum('Daily','Hourly') DEFAULT 'Daily',
	`date_hired` date,
	`contract_end_date` date,
	`regularization_date` date,
	`first_day_of_service` date,
	`original_appointment_date` date,
	`last_promotion_date` date,
	`duty_type` enum('Standard','Irregular') DEFAULT 'Standard',
	`daily_target_hours` decimal(4,2) DEFAULT '8.00',
	`start_time` varchar(50),
	`end_time` varchar(50),
	`is_regular` boolean DEFAULT false,
	`is_old_employee` boolean DEFAULT false,
	`is_meycauayan` boolean DEFAULT false,
	`profile_status` enum('Initial','Complete') DEFAULT 'Initial',
	`religion` varchar(100),
	`barangay` varchar(100),
	`facebook_url` varchar(255),
	`linkedin_url` varchar(255),
	`twitter_handle` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pds_hr_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pds_personal_information` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`birth_date` date,
	`place_of_birth` varchar(255),
	`gender` enum('Male','Female'),
	`civil_status` enum('Single','Married','Widowed','Separated','Annulled'),
	`height_m` decimal(4,2),
	`weight_kg` decimal(5,2),
	`blood_type` varchar(5),
	`citizenship` varchar(50) DEFAULT 'Filipino',
	`citizenship_type` varchar(50),
	`dual_country` varchar(100),
	`residential_address` text,
	`residential_zip_code` varchar(50),
	`permanent_address` text,
	`permanent_zip_code` varchar(50),
	`telephone_no` varchar(50),
	`mobile_no` varchar(50),
	`email` varchar(255),
	`umid_no` varchar(50),
	`philsys_id` varchar(50),
	`philhealth_number` varchar(50),
	`pagibig_number` varchar(50),
	`tin_number` varchar(50),
	`gsis_number` varchar(50),
	`agency_employee_no` varchar(50),
	`res_house_block_lot` varchar(150),
	`res_street` varchar(150),
	`res_subdivision` varchar(150),
	`res_barangay` varchar(150),
	`res_city` varchar(150),
	`res_province` varchar(150),
	`res_region` varchar(150),
	`perm_house_block_lot` varchar(150),
	`perm_street` varchar(150),
	`perm_subdivision` varchar(150),
	`perm_barangay` varchar(150),
	`perm_city` varchar(150),
	`perm_province` varchar(150),
	`perm_region` varchar(150),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pds_personal_information_id` PRIMARY KEY(`id`),
	CONSTRAINT `umid_no_unique` UNIQUE(`umid_no`),
	CONSTRAINT `philsys_id_unique` UNIQUE(`philsys_id`),
	CONSTRAINT `philhealth_no_unique` UNIQUE(`philhealth_number`),
	CONSTRAINT `pagibig_no_unique` UNIQUE(`pagibig_number`),
	CONSTRAINT `tin_no_unique` UNIQUE(`tin_number`),
	CONSTRAINT `gsis_no_unique` UNIQUE(`gsis_number`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`module` varchar(50) NOT NULL,
	`action` varchar(50) NOT NULL,
	`details` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leave_applications` MODIFY COLUMN `leave_type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `leave_balances` MODIFY COLUMN `credit_type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `leave_ledger` MODIFY COLUMN `credit_type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `leave_monetization_requests` MODIFY COLUMN `credit_type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_audit_log` MODIFY COLUMN `review_id` int;--> statement-breakpoint
ALTER TABLE `shift_templates` ADD `department_id` int;--> statement-breakpoint
ALTER TABLE `shift_templates` ADD `is_default` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `shift_templates` ADD `working_days` text;--> statement-breakpoint
ALTER TABLE `leave_applications` ADD `rejected_by` varchar(50);--> statement-breakpoint
ALTER TABLE `leave_applications` ADD `rejected_at` timestamp;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `training` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `is_email_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `verification_token` varchar(6);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `voluntary_work` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `umid_no_unique` UNIQUE(`umid_no`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `philsys_id_unique` UNIQUE(`philsys_id`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `philhealth_no_unique` UNIQUE(`philhealth_no`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `pagibig_no_unique` UNIQUE(`pagibig_no`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `tin_no_unique` UNIQUE(`tin_no`);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `gsis_no_unique` UNIQUE(`gsis_no`);--> statement-breakpoint
ALTER TABLE `pds_declarations` ADD CONSTRAINT `pds_declarations_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_hr_details` ADD CONSTRAINT `pds_hr_details_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_hr_details` ADD CONSTRAINT `pds_hr_details_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_hr_details` ADD CONSTRAINT `pds_hr_details_position_id_plantilla_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `plantilla_positions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `pds_personal_information_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_authentication_id_fk` FOREIGN KEY (`user_id`) REFERENCES `authentication`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_declarations` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_hr_employee_id` ON `pds_hr_details` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_personal_information` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_module` ON `audit_logs` (`module`);--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `audit_logs` (`created_at`);