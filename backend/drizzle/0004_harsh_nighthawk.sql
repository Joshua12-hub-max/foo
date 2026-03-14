ALTER TABLE `budget_allocation` drop column `remaining_budget`;--> statement-breakpoint
ALTER TABLE `budget_allocation` ADD `remaining_budget` decimal(15,2) GENERATED ALWAYS AS (total_budget - utilized_budget) STORED;--> statement-breakpoint
ALTER TABLE `budget_allocation` drop column `utilization_rate`;--> statement-breakpoint
ALTER TABLE `budget_allocation` ADD `utilization_rate` decimal(5,2) GENERATED ALWAYS AS ((utilized_budget / NULLIF(total_budget, 0)) * 100) STORED;--> statement-breakpoint
ALTER TABLE `authentication` MODIFY COLUMN `employee_id` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` MODIFY COLUMN `philhealth_number` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` MODIFY COLUMN `pagibig_number` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` MODIFY COLUMN `tin_number` varchar(50);--> statement-breakpoint
ALTER TABLE `authentication` MODIFY COLUMN `gsis_number` varchar(50);--> statement-breakpoint
ALTER TABLE `bio_attendance_logs` MODIFY COLUMN `employee_id` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `bio_enrolled_users` MODIFY COLUMN `employee_id` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `leave_applications` MODIFY COLUMN `attachment_path` varchar(500);--> statement-breakpoint
ALTER TABLE `leave_applications` MODIFY COLUMN `admin_form_path` varchar(500);--> statement-breakpoint
ALTER TABLE `leave_applications` MODIFY COLUMN `final_attachment_path` varchar(500);--> statement-breakpoint
ALTER TABLE `recruitment_jobs` MODIFY COLUMN `employment_type` enum('Full-time','Part-time','Contractual','Job Order','Coterminous','Temporary','Probationary','Casual','Permanent','Contract of Service','JO','COS') DEFAULT 'Full-time';--> statement-breakpoint
ALTER TABLE `authentication` ADD `profile_status` enum('Initial','Complete') DEFAULT 'Initial';--> statement-breakpoint
ALTER TABLE `google_calendar_tokens` ADD `refresh_token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `social_connections` ADD `refresh_token` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `is_edited` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `is_deleted_for_everyone` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `deleted_by_applicant` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `deleted_by_administrator` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `educational_background` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `emergency_contact` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `emergency_contact_number` varchar(20);--> statement-breakpoint
ALTER TABLE `recruitment_jobs` ADD `duty_type` enum('Standard','Irregular') DEFAULT 'Standard';--> statement-breakpoint
ALTER TABLE `recruitment_jobs` ADD `education` text;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` ADD `experience` text;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` ADD `training` text;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` ADD `eligibility` text;--> statement-breakpoint
ALTER TABLE `recruitment_jobs` ADD `other_qualifications` text;--> statement-breakpoint
ALTER TABLE `policy_violations` ADD `memo_id` int;--> statement-breakpoint
CREATE INDEX `idx_employee_violation` ON `policy_violations` (`employee_id`,`type`,`memo_id`);