ALTER TABLE `authentication` DROP INDEX `rfid_card_uid`;--> statement-breakpoint
ALTER TABLE `performance_improvement_plans` DROP FOREIGN KEY `performance_improvement_plans_supervisor_id_authentication_id_fk`;
--> statement-breakpoint
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_review_cycle_id_performance_review_cycles_id_fk`;
--> statement-breakpoint
DROP INDEX `supervisor_id` ON `performance_improvement_plans`;--> statement-breakpoint
ALTER TABLE `plantilla_positions` MODIFY COLUMN `is_vacant` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `plantilla_positions` MODIFY COLUMN `is_coterminous` boolean;--> statement-breakpoint
ALTER TABLE `plantilla_positions` MODIFY COLUMN `is_coterminous` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `qualification_standards` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `leave_applications` MODIFY COLUMN `is_with_pay` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `leave_requests` MODIFY COLUMN `with_pay` boolean;--> statement-breakpoint
ALTER TABLE `leave_requests` MODIFY COLUMN `with_pay` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `sender_type` enum('Applicant','Administrator') NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `is_read` boolean;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `is_read` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` MODIFY COLUMN `is_meycauayan_resident` boolean;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` MODIFY COLUMN `is_meycauayan_resident` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `require_civil_service` boolean;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `require_civil_service` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `require_government_ids` boolean;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `require_government_ids` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `require_education_experience` boolean;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `require_education_experience` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `performance_criteria` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `performance_review_cycles` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `disagreed` boolean;--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `disagreed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `is_self_assessment` boolean;--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `is_self_assessment` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employee_education` MODIFY COLUMN `is_current` boolean;--> statement-breakpoint
ALTER TABLE `employee_education` MODIFY COLUMN `is_current` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employee_emergency_contacts` MODIFY COLUMN `is_primary` boolean;--> statement-breakpoint
ALTER TABLE `employee_emergency_contacts` MODIFY COLUMN `is_primary` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employee_employment_history` MODIFY COLUMN `is_current` boolean;--> statement-breakpoint
ALTER TABLE `employee_employment_history` MODIFY COLUMN `is_current` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employee_memos` MODIFY COLUMN `acknowledgment_required` boolean;--> statement-breakpoint
ALTER TABLE `employee_memos` MODIFY COLUMN `acknowledgment_required` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employee_notes` MODIFY COLUMN `is_private` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `pds_work_experience` MODIFY COLUMN `is_government` boolean;--> statement-breakpoint
ALTER TABLE `pds_work_experience` MODIFY COLUMN `is_government` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `service_records` MODIFY COLUMN `is_with_pay` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `salary_tranches` MODIFY COLUMN `is_active` boolean;--> statement-breakpoint
ALTER TABLE `salary_tranches` MODIFY COLUMN `is_active` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `authentication` ADD `school_name` varchar(255);--> statement-breakpoint
ALTER TABLE `authentication` ADD `course` varchar(255);--> statement-breakpoint
ALTER TABLE `authentication` ADD `year_graduated` varchar(10);--> statement-breakpoint
ALTER TABLE `authentication` ADD `religion` varchar(100);--> statement-breakpoint
ALTER TABLE `authentication` ADD `citizenship` varchar(50) DEFAULT 'Filipino';--> statement-breakpoint
ALTER TABLE `authentication` ADD `citizenship_type` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` ADD `sss_no` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` ADD `sss_number` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` ADD `barangay` varchar(100);--> statement-breakpoint
ALTER TABLE `google_calendar_tokens` ADD `refreshToken` text NOT NULL;--> statement-breakpoint
ALTER TABLE `social_connections` ADD `refreshToken` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `school_name` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `course` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `year_graduated` varchar(10);--> statement-breakpoint
ALTER TABLE `performance_improvement_plans` ADD `reviewer_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD `reviewer_rating_score` decimal(3,2);--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD `reviewer_remarks` text;--> statement-breakpoint
ALTER TABLE `performance_improvement_plans` ADD CONSTRAINT `performance_improvement_plans_reviewer_id_authentication_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `authentication`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reviewer_id` ON `performance_improvement_plans` (`reviewer_id`);--> statement-breakpoint
ALTER TABLE `authentication` DROP COLUMN `supervisor`;--> statement-breakpoint
ALTER TABLE `google_calendar_tokens` DROP COLUMN `refresh_token`;--> statement-breakpoint
ALTER TABLE `social_connections` DROP COLUMN `refresh_token`;--> statement-breakpoint
ALTER TABLE `performance_improvement_plans` DROP COLUMN `supervisor_id`;--> statement-breakpoint
ALTER TABLE `performance_reviews` DROP COLUMN `supervisor_rating_score`;--> statement-breakpoint
ALTER TABLE `performance_reviews` DROP COLUMN `supervisor_remarks`;