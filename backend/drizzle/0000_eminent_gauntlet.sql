CREATE TABLE `budget_allocation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`department` varchar(255) NOT NULL,
	`total_budget` decimal(15,2) NOT NULL,
	`utilized_budget` decimal(15,2) DEFAULT '0.00',
	`remaining_budget` decimal(15,2) GENERATED ALWAYS AS ((`total_budget` - `utilized_budget`)) STORED,
	`utilization_rate` decimal(5,2) GENERATED ALWAYS AS (((`utilized_budget` / `total_budget`) * 100)) STORED,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_allocation_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_year_dept` UNIQUE(`year`,`department`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`head_of_department` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`budget` decimal(15,2) DEFAULT '0.00',
	`parent_department_id` int,
	`location` varchar(255),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `nepotism_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id_1` int NOT NULL,
	`employee_id_2` int NOT NULL,
	`relationship_type` enum('Parent','Child','Sibling','Spouse','Uncle/Aunt','Nephew/Niece','Cousin','Grandparent','Grandchild','In-Law') NOT NULL,
	`degree` int NOT NULL,
	`verified_by` int,
	`verified_at` timestamp,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `nepotism_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plantilla_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position_id` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`actor_id` int NOT NULL,
	`old_values` json,
	`new_values` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `plantilla_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plantilla_position_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`employee_name` varchar(255),
	`position_title` varchar(100),
	`start_date` date NOT NULL,
	`end_date` date,
	`reason` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `plantilla_position_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plantilla_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_number` varchar(50) NOT NULL,
	`position_title` varchar(100) NOT NULL,
	`salary_grade` int NOT NULL,
	`step_increment` int DEFAULT 1,
	`department` varchar(100),
	`department_id` int,
	`is_vacant` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`incumbent_id` int,
	`monthly_salary` decimal(12,2),
	`filled_date` date,
	`vacated_date` date,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`ordinance_number` varchar(100),
	`ordinance_date` date,
	`abolishment_ordinance` varchar(100),
	`abolishment_date` date,
	`qualification_standards_id` int,
	`budget_source` varchar(100) DEFAULT 'Regular',
	`is_coterminous` tinyint DEFAULT 0,
	`status` enum('Active','Abolished','Frozen') DEFAULT 'Active',
	`area_code` varchar(50),
	`area_type` enum('R','P','D','M','F','B'),
	`area_level` enum('K','T','S','A'),
	`last_promotion_date` date,
	CONSTRAINT `plantilla_positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `item_number` UNIQUE(`item_number`)
);
--> statement-breakpoint
CREATE TABLE `position_publications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position_id` int NOT NULL,
	`publication_date` date NOT NULL,
	`closing_date` date NOT NULL,
	`publication_medium` varchar(255) DEFAULT 'CSC Bulletin, LGU Website',
	`form_9_path` varchar(500),
	`status` enum('Draft','Published','Closed','Filled') DEFAULT 'Draft',
	`applicants_count` int DEFAULT 0,
	`notes` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `position_publications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualification_standards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position_title` varchar(255) NOT NULL,
	`salary_grade` int NOT NULL,
	`education_requirement` text NOT NULL,
	`experience_years` int DEFAULT 0,
	`training_hours` int DEFAULT 0,
	`eligibility_required` varchar(255) NOT NULL,
	`competency_requirements` text,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qualification_standards_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_position_sg` UNIQUE(`position_title`,`salary_grade`)
);
--> statement-breakpoint
CREATE TABLE `authentication` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`suffix` varchar(20),
	`email` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL,
	`department` varchar(100),
	`department_id` int,
	`employee_id` varchar(50) NOT NULL,
	`rfid_card_uid` varchar(50),
	`password_hash` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`is_verified` boolean DEFAULT false,
	`verification_token` varchar(255),
	`reset_password_token` varchar(255),
	`reset_password_expires` datetime,
	`google_id` varchar(255),
	`avatar_url` varchar(500),
	`job_title` varchar(100),
	`employment_status` enum('Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause') DEFAULT 'Active',
	`employment_type` varchar(50) DEFAULT 'Probationary',
	`date_hired` date,
	`contract_end_date` date,
	`regularization_date` date,
	`is_regular` boolean DEFAULT false,
	`manager_id` int,
	`birth_date` date,
	`gender` enum('Male','Female'),
	`civil_status` enum('Single','Married','Widowed','Separated','Annulled'),
	`nationality` varchar(50) DEFAULT 'Filipino',
	`blood_type` varchar(5),
	`height_cm` decimal(5,2),
	`weight_kg` decimal(5,2),
	`phone_number` varchar(20),
	`address` text,
	`permanent_address` text,
	`emergency_contact` varchar(100),
	`emergency_contact_number` varchar(20),
	`umid_no` varchar(50),
	`philhealth_number` varchar(20),
	`pagibig_number` varchar(20),
	`tin_number` varchar(20),
	`gsis_number` varchar(20),
	`salary_grade` varchar(10),
	`step_increment` int DEFAULT 1,
	`appointment_type` enum('Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS'),
	`office_address` text,
	`station` varchar(100),
	`position_title` varchar(100),
	`item_number` varchar(50),
	`position_id` int,
	`first_day_of_service` date,
	`supervisor` varchar(100),
	`refresh_token` text,
	`two_factor_enabled` boolean DEFAULT false,
	`two_factor_otp` varchar(6),
	`two_factor_otp_expires` datetime,
	`eligibility_type` varchar(255),
	`eligibility_number` varchar(100),
	`eligibility_date` date,
	`highest_education` varchar(255),
	`educational_background` text,
	`years_of_experience` varchar(50),
	`experience` text,
	`skills` text,
	`place_of_birth` varchar(255),
	`date_of_birth` date,
	`height_m` decimal(4,2),
	`gsis_id_no` varchar(50),
	`pagibig_id_no` varchar(50),
	`philhealth_no` varchar(50),
	`philsys_id` varchar(50),
	`tin_no` varchar(50),
	`agency_employee_no` varchar(50),
	`residential_address` text,
	`residential_zip_code` varchar(50),
	`permanent_zip_code` varchar(50),
	`telephone_no` varchar(50),
	`mobile_no` varchar(50),
	`original_appointment_date` date,
	`last_promotion_date` date,
	`middle_name` varchar(100),
	`facebook_url` varchar(255),
	`linkedin_url` varchar(255),
	`twitter_handle` varchar(100),
	`duty_type` enum('Standard','Irregular') DEFAULT 'Standard',
	`daily_target_hours` decimal(4,2) DEFAULT '8.00',
	`salary_basis` enum('Daily','Hourly') DEFAULT 'Daily',
	`login_attempts` int DEFAULT 0,
	`lock_until` datetime,
	CONSTRAINT `authentication_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`),
	CONSTRAINT `employee_id` UNIQUE(`employee_id`),
	CONSTRAINT `google_id` UNIQUE(`google_id`),
	CONSTRAINT `rfid_card_uid` UNIQUE(`rfid_card_uid`)
);
--> statement-breakpoint
CREATE TABLE `google_calendar_tokens` (
	`user_id` int NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`token_expiry` datetime NOT NULL,
	`sync_enabled` boolean DEFAULT true,
	`calendar_id` varchar(255) DEFAULT 'primary',
	`last_sync` datetime DEFAULT (CURRENT_TIMESTAMP),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_calendar_tokens_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `social_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`provider` enum('facebook','jobstreet') NOT NULL,
	`provider_user_id` varchar(100) NOT NULL,
	`provider_user_name` varchar(255),
	`access_token` text,
	`refresh_token` text,
	`expires_at` datetime,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_provider` UNIQUE(`user_id`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `attendance_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`scan_time` datetime NOT NULL,
	`type` enum('IN','OUT') NOT NULL,
	`source` varchar(50) DEFAULT 'BIOMETRIC',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendance_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bio_attendance_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`card_type` enum('IN','OUT') NOT NULL,
	`log_date` date NOT NULL,
	`log_time` time NOT NULL,
	`created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `bio_attendance_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bio_enrolled_users` (
	`employee_id` int NOT NULL,
	`full_name` varchar(150) NOT NULL,
	`department` varchar(100),
	`user_status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`enrolled_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `bio_enrolled_users_employee_id` PRIMARY KEY(`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `daily_time_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`date` date NOT NULL,
	`time_in` datetime,
	`time_out` datetime,
	`late_minutes` int DEFAULT 0,
	`undertime_minutes` int DEFAULT 0,
	`overtime_minutes` int DEFAULT 0,
	`status` varchar(50) DEFAULT 'Present',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_time_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_dtr` UNIQUE(`employee_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `dtr_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`date_time` date NOT NULL,
	`original_time_in` datetime,
	`original_time_out` datetime,
	`corrected_time_in` datetime,
	`corrected_time_out` datetime,
	`reason` text,
	`status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
	`rejection_reason` text,
	`approved_by` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dtr_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fingerprints` (
	`fingerprint_id` int NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`template` longtext,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fingerprints_fingerprint_id` PRIMARY KEY(`fingerprint_id`),
	CONSTRAINT `employee_id` UNIQUE(`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`schedule_title` varchar(255) DEFAULT 'Regular Schedule',
	`start_date` date,
	`end_date` date,
	`day_of_week` varchar(20) NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`repeat_pattern` varchar(50) DEFAULT 'Weekly',
	`is_rest_day` boolean DEFAULT false,
	`is_special` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tardiness_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`total_late_minutes` int DEFAULT 0,
	`total_undertime_minutes` int DEFAULT 0,
	`total_late_count` int DEFAULT 0,
	`total_undertime_count` int DEFAULT 0,
	`total_absence_count` int DEFAULT 0,
	`total_minutes` int GENERATED ALWAYS AS ((`total_late_minutes` + `total_undertime_minutes`)) STORED,
	`days_equivalent` decimal(5,3) DEFAULT '0.000',
	`deducted_from_vl` decimal(5,3) DEFAULT '0.000',
	`charged_as_lwop` decimal(5,3) DEFAULT '0.000',
	`processed_at` timestamp,
	`processed_by` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tardiness_summary_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_tardiness` UNIQUE(`employee_id`,`year`,`month`)
);
--> statement-breakpoint
CREATE TABLE `leave_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`leave_type` enum('Vacation Leave','Sick Leave','Special Privilege Leave','Forced Leave','Maternity Leave','Paternity Leave','Solo Parent Leave','Study Leave','Special Emergency Leave','VAWC Leave','Rehabilitation Leave','Special Leave Benefits for Women','Wellness Leave','Adoption Leave') NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`working_days` decimal(10,3) NOT NULL,
	`is_with_pay` tinyint NOT NULL DEFAULT 1,
	`actual_payment_status` enum('WITH_PAY','WITHOUT_PAY','PARTIAL') NOT NULL DEFAULT 'WITH_PAY',
	`days_with_pay` decimal(10,3) DEFAULT '0.000',
	`days_without_pay` decimal(10,3) DEFAULT '0.000',
	`cross_charged_from` varchar(50),
	`reason` text NOT NULL,
	`medical_certificate_path` varchar(255),
	`status` enum('Pending','Processing','Finalizing','Approved','Rejected','Cancelled') DEFAULT 'Pending',
	`attachment_path` varchar(255),
	`admin_form_path` varchar(255),
	`final_attachment_path` varchar(255),
	`rejection_reason` text,
	`approved_by` varchar(50),
	`approved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`credit_type` enum('Vacation Leave','Sick Leave','Special Privilege Leave','Forced Leave','Maternity Leave','Paternity Leave','Solo Parent Leave','Study Leave','Adoption Leave') NOT NULL,
	`balance` decimal(10,3) NOT NULL DEFAULT '0.000',
	`year` int NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_balance` UNIQUE(`employee_id`,`credit_type`,`year`)
);
--> statement-breakpoint
CREATE TABLE `leave_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(255) NOT NULL,
	`credit_type` varchar(50) NOT NULL,
	`balance` decimal(10,2) DEFAULT '0.00',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_credit` UNIQUE(`employee_id`,`credit_type`)
);
--> statement-breakpoint
CREATE TABLE `leave_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`credit_type` enum('Vacation Leave','Sick Leave','Special Privilege Leave','Forced Leave','Maternity Leave','Paternity Leave','Solo Parent Leave','Study Leave','Adoption Leave') NOT NULL,
	`transaction_type` enum('ACCRUAL','DEDUCTION','ADJUSTMENT','MONETIZATION','FORFEITURE','UNDERTIME_DEDUCTION','TARDINESS_DEDUCTION') NOT NULL,
	`amount` decimal(10,3) NOT NULL,
	`balance_after` decimal(10,3) NOT NULL,
	`reference_id` int,
	`reference_type` enum('leave_application','monetization','dtr','manual'),
	`remarks` text,
	`created_by` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `leave_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_monetization_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`credit_type` enum('Vacation Leave','Sick Leave') NOT NULL,
	`requested_days` decimal(10,3) NOT NULL,
	`daily_rate` decimal(12,2) NOT NULL,
	`total_amount` decimal(12,2) NOT NULL,
	`purpose` enum('Health','Medical','Financial Emergency') NOT NULL,
	`status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
	`approved_by` varchar(50),
	`remarks` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_monetization_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`leave_type` varchar(50) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`reason` text,
	`status` enum('Pending','Processing','Finalizing','Approved','Rejected') DEFAULT 'Pending',
	`rejection_reason` text,
	`approved_by` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`attachment_path` varchar(255),
	`admin_form_path` varchar(255),
	`final_attachment_path` varchar(255),
	`with_pay` tinyint DEFAULT 0,
	CONSTRAINT `leave_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lwop_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`year` int NOT NULL,
	`total_lwop_days` decimal(10,3) DEFAULT '0.000',
	`salary_deduction` decimal(12,2) DEFAULT '0.00',
	`cumulative_lwop_days` decimal(10,3) DEFAULT '0.000',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lwop_summary_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_lwop` UNIQUE(`employee_id`,`year`)
);
--> statement-breakpoint
CREATE TABLE `chat_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicant_name` varchar(100) NOT NULL,
	`applicant_email` varchar(255) NOT NULL,
	`status` enum('Active','Closed','Archived') DEFAULT 'Active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`sender_type` enum('Applicant','Admin') NOT NULL,
	`sender_id` int,
	`message` text NOT NULL,
	`is_read` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`status` enum('Pending','Read','Replied','Archived') DEFAULT 'Pending',
	`admin_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruitment_applicants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`phone_number` varchar(20),
	`resume_path` varchar(255),
	`photo_path` varchar(255),
	`status` enum('Applied','Screening','Interview','Offer','Hired','Rejected') DEFAULT 'Applied',
	`source` enum('web','email') DEFAULT 'web',
	`email_subject` varchar(255),
	`email_received_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	`stage` enum('Applied','Screening','Initial Interview','Final Interview','Offer','Hired','Rejected') DEFAULT 'Applied',
	`interview_date` datetime,
	`interview_link` varchar(500),
	`interview_platform` enum('Jitsi Meet','Google Meet','Zoom','Other') DEFAULT 'Google Meet',
	`interview_notes` text,
	`interviewer_id` int,
	`middle_name` varchar(100),
	`suffix` varchar(10),
	`zip_code` varchar(10),
	`birth_date` datetime,
	`birth_place` varchar(255),
	`sex` enum('Male','Female'),
	`civil_status` enum('Single','Married','Widowed','Separated','Annulled'),
	`height` varchar(20),
	`weight` varchar(20),
	`blood_type` varchar(10),
	`gsis_no` varchar(50),
	`pagibig_no` varchar(50),
	`philhealth_no` varchar(50),
	`umid_no` varchar(50),
	`philsys_id` varchar(50),
	`tin_no` varchar(50),
	`eligibility` text,
	`eligibility_type` varchar(100),
	`eligibility_date` datetime,
	`eligibility_rating` varchar(50),
	`eligibility_place` varchar(255),
	`license_no` varchar(50),
	`eligibility_path` varchar(255),
	`total_experience_years` int,
	`address` text,
	`permanent_address` text,
	`permanent_zip_code` varchar(10),
	`education` text,
	`experience` text,
	`skills` text,
	`hired_date` datetime,
	`is_meycauayan_resident` tinyint DEFAULT 0,
	CONSTRAINT `recruitment_applicants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruitment_email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stage_name` varchar(50) NOT NULL,
	`subject_template` varchar(255) NOT NULL,
	`body_template` text NOT NULL,
	`available_variables` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recruitment_email_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `stage_name` UNIQUE(`stage_name`)
);
--> statement-breakpoint
CREATE TABLE `recruitment_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`department` varchar(100) NOT NULL,
	`job_description` text NOT NULL,
	`requirements` text,
	`location` varchar(100) DEFAULT 'Main Office',
	`employment_type` enum('Full-time','Part-time','Contractual','Job Order','Coterminous','Temporary','Probationary','Casual','Permanent') DEFAULT 'Full-time',
	`status` enum('Open','Closed','On Hold') DEFAULT 'Open',
	`application_email` varchar(255),
	`posted_by` int,
	`posted_at` datetime,
	`fb_post_id` varchar(100),
	`linkedin_post_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`attachment_path` varchar(255),
	`require_civil_service` tinyint DEFAULT 0,
	`require_government_ids` tinyint DEFAULT 0,
	`require_education_experience` tinyint DEFAULT 0,
	CONSTRAINT `recruitment_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruitment_security_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`email` varchar(255),
	`violation_type` varchar(100),
	`details` text,
	`ip_address` varchar(45),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `recruitment_security_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`review_id` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`actor_id` int NOT NULL,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `performance_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) DEFAULT 'General',
	`criteria_type` enum('core_function','support_function','core_competency','organizational_competency') DEFAULT 'core_function',
	`weight` decimal(5,2) DEFAULT '1.00',
	`max_score` int DEFAULT 5,
	`rating_definition_5` text,
	`rating_definition_4` text,
	`rating_definition_3` text,
	`rating_definition_2` text,
	`rating_definition_1` text,
	`evidence_requirements` text,
	`created_at` timestamp DEFAULT (now()),
	`is_active` tinyint DEFAULT 1,
	CONSTRAINT `performance_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`review_cycle_id` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`metric` varchar(255),
	`target_value` decimal(10,2),
	`current_value` decimal(10,2) DEFAULT '0.00',
	`weight` decimal(5,2) DEFAULT '1.00',
	`start_date` date,
	`due_date` date,
	`status` enum('Not Started','In Progress','Completed','Cancelled') DEFAULT 'Not Started',
	`progress` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `performance_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_improvement_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`supervisor_id` int NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`areas_of_concern` text NOT NULL,
	`action_plan` text NOT NULL,
	`status` enum('Active','Completed','Failed','Terminated') DEFAULT 'Active',
	`outcome_notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `performance_improvement_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_review_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`status` enum('Draft','Active','Completed','Archived') DEFAULT 'Draft',
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`rating_period` enum('1st_sem','2nd_sem','annual') DEFAULT 'annual',
	`is_active` tinyint DEFAULT 1,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_review_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_review_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`review_id` int NOT NULL,
	`criteria_id` int,
	`score` decimal(5,2),
	`self_score` decimal(3,2),
	`actual_accomplishments` text,
	`comment` text,
	`q_score` decimal(5,2),
	`e_score` decimal(5,2),
	`t_score` decimal(5,2),
	`criteria_title` varchar(255),
	`criteria_description` text,
	`weight` decimal(5,2) DEFAULT '0.00',
	`max_score` int DEFAULT 5,
	`category` varchar(100) DEFAULT 'General',
	`evidence_file_path` text,
	`evidence_description` text,
	CONSTRAINT `performance_review_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`reviewer_id` int NOT NULL,
	`review_period_start` date NOT NULL,
	`review_period_end` date NOT NULL,
	`status` enum('Draft','Self-Rated','Submitted','Acknowledged','Approved','Finalized') DEFAULT 'Draft',
	`total_score` decimal(5,2),
	`self_rating_score` decimal(3,2),
	`supervisor_rating_score` decimal(3,2),
	`final_rating_score` decimal(3,2),
	`self_rating_status` enum('pending','submitted') DEFAULT 'pending',
	`overall_feedback` text,
	`supervisor_remarks` text,
	`employee_remarks` text,
	`head_remarks` text,
	`disagree_remarks` text,
	`approved_by` int,
	`approved_at` timestamp,
	`disagreed` tinyint DEFAULT 0,
	`rating_period` enum('1st_sem','2nd_sem','annual') DEFAULT 'annual',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`review_cycle_id` int,
	`is_self_assessment` tinyint DEFAULT 0,
	`cycle_id` int,
	`evaluation_mode` enum('CSC','IPCR') DEFAULT 'CSC',
	CONSTRAINT `performance_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sections` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `performance_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_custom_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`section` varchar(255) NOT NULL,
	`field_name` varchar(255) NOT NULL,
	`field_value` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_custom_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`document_name` varchar(255) NOT NULL,
	`document_type` varchar(50),
	`file_path` varchar(255) NOT NULL,
	`file_size` int,
	`mime_type` varchar(100),
	`uploaded_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_education` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`institution` varchar(255) NOT NULL,
	`degree` varchar(255),
	`field_of_study` varchar(255),
	`start_date` date,
	`end_date` date,
	`is_current` tinyint DEFAULT 0,
	`description` text,
	`type` enum('Education','Certification','Training') DEFAULT 'Education',
	`expiry_date` date,
	`credential_url` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_education_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_emergency_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`relationship` varchar(50) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`email` varchar(100),
	`address` text,
	`is_primary` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_emergency_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_employment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`job_title` varchar(100) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date,
	`is_current` tinyint DEFAULT 0,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_employment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_memos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memo_number` varchar(50) NOT NULL,
	`employee_id` int NOT NULL,
	`author_id` int NOT NULL,
	`memo_type` enum('Verbal Warning','Written Warning','Reprimand','Suspension Notice','Termination Notice','Show Cause') NOT NULL DEFAULT 'Written Warning',
	`subject` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('Low','Normal','High','Urgent') NOT NULL DEFAULT 'Normal',
	`severity` enum('minor','moderate','major','grave','terminal') NOT NULL DEFAULT 'minor',
	`effective_date` date,
	`acknowledgment_required` tinyint DEFAULT 0,
	`acknowledged_at` datetime,
	`status` enum('Draft','Sent','Acknowledged','Archived') NOT NULL DEFAULT 'Draft',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_memos_id` PRIMARY KEY(`id`),
	CONSTRAINT `memo_number` UNIQUE(`memo_number`)
);
--> statement-breakpoint
CREATE TABLE `employee_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`author_id` int NOT NULL,
	`note_content` text NOT NULL,
	`category` varchar(50) DEFAULT 'General',
	`is_private` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`skill_name` varchar(100) NOT NULL,
	`category` varchar(50) DEFAULT 'Technical',
	`proficiency_level` enum('Beginner','Intermediate','Advanced','Expert') DEFAULT 'Intermediate',
	`years_experience` decimal(4,1),
	`endorsements` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_education` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`level` enum('Elementary','Secondary','Vocational','College','Graduate Studies') NOT NULL,
	`school_name` varchar(255) NOT NULL,
	`degree_course` varchar(255),
	`year_graduated` int,
	`units_earned` varchar(50),
	`date_from` int,
	`date_to` int,
	`honors` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_education_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_eligibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`eligibility_name` varchar(255) NOT NULL,
	`rating` decimal(5,2),
	`exam_date` date,
	`exam_place` varchar(255),
	`license_number` varchar(50),
	`validity_date` date,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_eligibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_family` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`relation_type` enum('Spouse','Father','Mother','Child') NOT NULL,
	`last_name` varchar(100),
	`first_name` varchar(100),
	`middle_name` varchar(100),
	`name_extension` varchar(10),
	`occupation` varchar(100),
	`employer` varchar(100),
	`business_address` varchar(255),
	`telephone_no` varchar(50),
	`date_of_birth` date,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_family_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_learning_development` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`date_from` date,
	`date_to` date,
	`hours_number` int,
	`type_of_ld` varchar(50),
	`conducted_by` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_learning_development_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_other_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`type` enum('Skill','Recognition','Membership') NOT NULL,
	`description` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_other_info_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255),
	`tel_no` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_references_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_voluntary_work` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`organization_name` varchar(255) NOT NULL,
	`address` varchar(255),
	`date_from` date,
	`date_to` date,
	`hours_number` int,
	`position` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_voluntary_work_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pds_work_experience` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`date_from` date NOT NULL,
	`date_to` date,
	`position_title` varchar(255) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`monthly_salary` decimal(12,2),
	`salary_grade` varchar(20),
	`appointment_status` varchar(50),
	`is_government` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pds_work_experience_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`event_type` enum('Appointment','Promotion','Leave','LWOP','Return from Leave','Transfer','Suspension','Resignation','Retirement','Other') NOT NULL,
	`event_date` date NOT NULL,
	`end_date` date,
	`leave_type` varchar(50),
	`days_count` decimal(5,1),
	`is_with_pay` tinyint DEFAULT 1,
	`remarks` text,
	`reference_id` int,
	`reference_type` varchar(50),
	`processed_by` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salary_grade` int NOT NULL,
	`step` int NOT NULL,
	`monthly_salary` decimal(12,2) NOT NULL,
	`tranche` int NOT NULL DEFAULT 2,
	CONSTRAINT `salary_schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_grade_step_tranche` UNIQUE(`salary_grade`,`step`,`tranche`)
);
--> statement-breakpoint
CREATE TABLE `salary_tranches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tranche_number` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`circular_number` varchar(100),
	`effective_date` date,
	`date_issued` date,
	`applicable_to` varchar(255),
	`is_active` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salary_tranches_id` PRIMARY KEY(`id`),
	CONSTRAINT `tranche_number` UNIQUE(`tranche_number`)
);
--> statement-breakpoint
CREATE TABLE `step_increment_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`position_id` int NOT NULL,
	`current_step` int NOT NULL,
	`previous_step` int,
	`eligible_date` date NOT NULL,
	`status` enum('Pending','Approved','Denied','Processed') DEFAULT 'Pending',
	`processed_at` timestamp,
	`processed_by` int,
	`remarks` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `step_increment_tracker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('hours','tardiness','penalties','csc','leave','plantilla') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`version_label` varchar(50),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internal_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policy_violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`type` enum('habitual_tardiness','habitual_undertime','consecutive_lateness','loafing','absence','misconduct','others') NOT NULL,
	`violation_subtype` varchar(50),
	`offense_level` int DEFAULT 1,
	`offense_number` int NOT NULL DEFAULT 1,
	`triggered_months` text,
	`fingerprint` varchar(255),
	`details` text NOT NULL,
	`memoId` int,
	`status` enum('pending','notified','resolved','cancelled') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `policy_violations_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_fingerprint_violation` UNIQUE(`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `address_ref_barangays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`zip_code` varchar(10) NOT NULL,
	CONSTRAINT `address_ref_barangays_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_barangay_name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('normal','high','urgent') DEFAULT 'normal',
	`created_at` timestamp DEFAULT (now()),
	`start_date` date,
	`end_date` date,
	`start_time` time,
	`end_time` time,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`start_date` date,
	`end_date` date,
	`department` varchar(100),
	`time` int DEFAULT 9,
	`created_at` timestamp DEFAULT (now()),
	`recurring_pattern` varchar(50) DEFAULT 'none',
	`recurring_end_date` date,
	`description` text,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`date` date NOT NULL,
	`type` enum('Regular','Special Non-Working','Special Working') NOT NULL,
	`year` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_holiday` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `memo_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`last_number` int NOT NULL DEFAULT 0,
	CONSTRAINT `memo_sequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_year` UNIQUE(`year`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`notification_id` int AUTO_INCREMENT NOT NULL,
	`recipient_id` varchar(50) NOT NULL,
	`sender_id` varchar(50),
	`title` varchar(255),
	`message` text,
	`type` varchar(50),
	`reference_id` int,
	`status` enum('read','unread') DEFAULT 'unread',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_notification_id` PRIMARY KEY(`notification_id`)
);
--> statement-breakpoint
CREATE TABLE `synced_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`local_event_id` int NOT NULL,
	`google_event_id` varchar(255) NOT NULL,
	`last_synced` datetime DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `synced_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_event_id` UNIQUE(`local_event_id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`setting_key` varchar(255) NOT NULL,
	`setting_value` text,
	`description` varchar(255),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_setting_key` PRIMARY KEY(`setting_key`)
);
--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `fk_parent_dept` FOREIGN KEY (`parent_department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plantilla_positions` ADD CONSTRAINT `plantilla_positions_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plantilla_positions` ADD CONSTRAINT `fk_pp_qs` FOREIGN KEY (`qualification_standards_id`) REFERENCES `qualification_standards`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authentication` ADD CONSTRAINT `authentication_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authentication` ADD CONSTRAINT `authentication_position_id_plantilla_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `plantilla_positions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authentication` ADD CONSTRAINT `fk_manager` FOREIGN KEY (`manager_id`) REFERENCES `authentication`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_calendar_tokens` ADD CONSTRAINT `google_calendar_tokens_user_id_authentication_id_fk` FOREIGN KEY (`user_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_connections` ADD CONSTRAINT `social_connections_user_id_authentication_id_fk` FOREIGN KEY (`user_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_conversation_id_chat_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `recruitment_applicants_job_id_recruitment_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `recruitment_jobs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD CONSTRAINT `recruitment_applicants_interviewer_id_authentication_id_fk` FOREIGN KEY (`interviewer_id`) REFERENCES `authentication`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_audit_log` ADD CONSTRAINT `performance_audit_log_review_id_performance_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `performance_reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_audit_log` ADD CONSTRAINT `performance_audit_log_actor_id_authentication_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_goals` ADD CONSTRAINT `performance_goals_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_goals` ADD CONSTRAINT `fk_pg_rc` FOREIGN KEY (`review_cycle_id`) REFERENCES `performance_review_cycles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_improvement_plans` ADD CONSTRAINT `performance_improvement_plans_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_improvement_plans` ADD CONSTRAINT `performance_improvement_plans_supervisor_id_authentication_id_fk` FOREIGN KEY (`supervisor_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_review_cycles` ADD CONSTRAINT `performance_review_cycles_created_by_authentication_id_fk` FOREIGN KEY (`created_by`) REFERENCES `authentication`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_review_items` ADD CONSTRAINT `performance_review_items_review_id_performance_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `performance_reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_review_items` ADD CONSTRAINT `performance_review_items_criteria_id_performance_criteria_id_fk` FOREIGN KEY (`criteria_id`) REFERENCES `performance_criteria`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewer_id_authentication_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `authentication`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_review_cycle_id_performance_review_cycles_id_fk` FOREIGN KEY (`review_cycle_id`) REFERENCES `performance_review_cycles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_custom_fields` ADD CONSTRAINT `employee_custom_fields_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_uploaded_by_authentication_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `authentication`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_education` ADD CONSTRAINT `employee_education_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_emergency_contacts` ADD CONSTRAINT `employee_emergency_contacts_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_employment_history` ADD CONSTRAINT `employee_employment_history_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_memos` ADD CONSTRAINT `employee_memos_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_memos` ADD CONSTRAINT `employee_memos_author_id_authentication_id_fk` FOREIGN KEY (`author_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_notes` ADD CONSTRAINT `employee_notes_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_notes` ADD CONSTRAINT `employee_notes_author_id_authentication_id_fk` FOREIGN KEY (`author_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_skills` ADD CONSTRAINT `employee_skills_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_education` ADD CONSTRAINT `pds_education_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_eligibility` ADD CONSTRAINT `pds_eligibility_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_family` ADD CONSTRAINT `pds_family_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_learning_development` ADD CONSTRAINT `pds_learning_development_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_other_info` ADD CONSTRAINT `pds_other_info_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_references` ADD CONSTRAINT `pds_references_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_voluntary_work` ADD CONSTRAINT `pds_voluntary_work_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pds_work_experience` ADD CONSTRAINT `pds_work_experience_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `step_increment_tracker` ADD CONSTRAINT `step_increment_tracker_employee_id_authentication_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `step_increment_tracker` ADD CONSTRAINT `step_increment_tracker_processed_by_authentication_id_fk` FOREIGN KEY (`processed_by`) REFERENCES `authentication`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `synced_events` ADD CONSTRAINT `synced_events_local_event_id_events_id_fk` FOREIGN KEY (`local_event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_year` ON `budget_allocation` (`year`);--> statement-breakpoint
CREATE INDEX `idx_department` ON `budget_allocation` (`department`);--> statement-breakpoint
CREATE INDEX `idx_employee_1` ON `nepotism_relationships` (`employee_id_1`);--> statement-breakpoint
CREATE INDEX `idx_employee_2` ON `nepotism_relationships` (`employee_id_2`);--> statement-breakpoint
CREATE INDEX `idx_degree` ON `nepotism_relationships` (`degree`);--> statement-breakpoint
CREATE INDEX `verified_by` ON `nepotism_relationships` (`verified_by`);--> statement-breakpoint
CREATE INDEX `idx_position_id` ON `plantilla_audit_log` (`position_id`);--> statement-breakpoint
CREATE INDEX `idx_actor_id` ON `plantilla_audit_log` (`actor_id`);--> statement-breakpoint
CREATE INDEX `idx_action` ON `plantilla_audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_position_id` ON `plantilla_position_history` (`position_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_id` ON `plantilla_position_history` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_position` ON `position_publications` (`position_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `position_publications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_publication_date` ON `position_publications` (`publication_date`);--> statement-breakpoint
CREATE INDEX `created_by` ON `position_publications` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_position_title` ON `qualification_standards` (`position_title`);--> statement-breakpoint
CREATE INDEX `idx_salary_grade` ON `qualification_standards` (`salary_grade`);--> statement-breakpoint
CREATE INDEX `idx_emp_date` ON `bio_attendance_logs` (`employee_id`,`log_date`);--> statement-breakpoint
CREATE INDEX `idx_date_time` ON `bio_attendance_logs` (`log_date`,`log_time`);--> statement-breakpoint
CREATE INDEX `idx_employee_day` ON `schedules` (`employee_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `idx_employee` ON `tardiness_summary` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_status` ON `leave_applications` (`employee_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_dates` ON `leave_applications` (`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `idx_leave_type` ON `leave_applications` (`leave_type`);--> statement-breakpoint
CREATE INDEX `idx_employee` ON `leave_balances` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_credit` ON `leave_ledger` (`employee_id`,`credit_type`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `leave_ledger` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reference` ON `leave_ledger` (`reference_id`,`reference_type`);--> statement-breakpoint
CREATE INDEX `idx_employee` ON `leave_monetization_requests` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `leave_monetization_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_employee` ON `lwop_summary` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_applicant_email` ON `chat_conversations` (`applicant_email`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `chat_conversations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_conversation` ON `chat_messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_is_read` ON `chat_messages` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `contact_inquiries` (`status`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `contact_inquiries` (`email`);--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `contact_inquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `job_id` ON `recruitment_applicants` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_violation` ON `recruitment_security_logs` (`violation_type`);--> statement-breakpoint
CREATE INDEX `review_id` ON `performance_audit_log` (`review_id`);--> statement-breakpoint
CREATE INDEX `actor_id` ON `performance_audit_log` (`actor_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `performance_goals` (`employee_id`);--> statement-breakpoint
CREATE INDEX `review_cycle_id` ON `performance_goals` (`review_cycle_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `performance_improvement_plans` (`employee_id`);--> statement-breakpoint
CREATE INDEX `supervisor_id` ON `performance_improvement_plans` (`supervisor_id`);--> statement-breakpoint
CREATE INDEX `created_by` ON `performance_review_cycles` (`created_by`);--> statement-breakpoint
CREATE INDEX `review_id` ON `performance_review_items` (`review_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `performance_reviews` (`employee_id`);--> statement-breakpoint
CREATE INDEX `reviewer_id` ON `performance_reviews` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_custom_fields` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_documents` (`employee_id`);--> statement-breakpoint
CREATE INDEX `uploaded_by` ON `employee_documents` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_education` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_emergency_contacts` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_employment_history` (`employee_id`);--> statement-breakpoint
CREATE INDEX `author_id` ON `employee_memos` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_memo_employee` ON `employee_memos` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_memo_type` ON `employee_memos` (`memo_type`);--> statement-breakpoint
CREATE INDEX `idx_memo_status` ON `employee_memos` (`status`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_notes` (`employee_id`);--> statement-breakpoint
CREATE INDEX `author_id` ON `employee_notes` (`author_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_skills` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_education` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_eligibility` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_emp` ON `pds_family` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_learning_development` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_other_info` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_references` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_voluntary_work` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `pds_work_experience` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_employee` ON `service_records` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_event_type` ON `service_records` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_event_date` ON `service_records` (`event_date`);--> statement-breakpoint
CREATE INDEX `idx_grade` ON `salary_schedule` (`salary_grade`);--> statement-breakpoint
CREATE INDEX `idx_salary_schedule_tranche` ON `salary_schedule` (`tranche`);--> statement-breakpoint
CREATE INDEX `idx_employee` ON `step_increment_tracker` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `step_increment_tracker` (`status`);--> statement-breakpoint
CREATE INDEX `idx_eligible_date` ON `step_increment_tracker` (`eligible_date`);--> statement-breakpoint
CREATE INDEX `processed_by` ON `step_increment_tracker` (`processed_by`);--> statement-breakpoint
CREATE INDEX `idx_employee_violation` ON `policy_violations` (`employee_id`,`type`,`memoId`);--> statement-breakpoint
CREATE ALGORITHM = undefined
SQL SECURITY definer
VIEW `employee_directory` AS (select `a`.`id` AS `id`,`a`.`employee_id` AS `employee_id`,`a`.`rfid_card_uid` AS `rfid_card_uid`,`a`.`first_name` AS `first_name`,`a`.`last_name` AS `last_name`,concat(`a`.`first_name`,' ',`a`.`last_name`) AS `full_name`,`a`.`email` AS `email`,`a`.`role` AS `role`,`a`.`job_title` AS `job_title`,`a`.`employment_status` AS `employment_status`,`a`.`avatar_url` AS `avatar_url`,`d`.`id` AS `department_id`,`d`.`name` AS `department_name`,`d`.`location` AS `department_location`,`a`.`phone_number` AS `phone_number`,`a`.`position_title` AS `position_title` from (`chrmo_db`.`authentication` `a` left join `chrmo_db`.`departments` `d` on((`a`.`department_id` = `d`.`id`))) where (`a`.`employment_status` <> 'Terminated'));