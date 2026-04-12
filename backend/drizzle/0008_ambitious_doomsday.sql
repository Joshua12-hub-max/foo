CREATE TABLE `applicant_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicant_id` int NOT NULL,
	`document_name` varchar(255) NOT NULL,
	`document_type` varchar(50),
	`file_path` varchar(255) NOT NULL,
	`file_size` int,
	`mime_type` varchar(100),
	`uploaded_at` timestamp DEFAULT (now()),
	CONSTRAINT `applicant_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `leave_requests`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP INDEX `uq_pds_umid_number`;--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `self_rating_score` decimal(5,2);--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `reviewer_rating_score` decimal(5,2);--> statement-breakpoint
ALTER TABLE `performance_reviews` MODIFY COLUMN `final_rating_score` decimal(5,2);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `govt_id_type` varchar(100);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `govt_id_no` varchar(100);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `govt_id_issuance` varchar(255);--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `family_background` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `children` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `voluntary_work` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `pds_references` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `other_info` text;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `pds_questions` text;--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD `umid_no` varchar(50);--> statement-breakpoint
ALTER TABLE `attendance_logs` ADD CONSTRAINT `unique_log` UNIQUE(`employee_id`,`scan_time`,`type`);--> statement-breakpoint
ALTER TABLE `pds_personal_information` ADD CONSTRAINT `uq_pds_umid_number` UNIQUE(`umid_no`);--> statement-breakpoint
ALTER TABLE `applicant_documents` ADD CONSTRAINT `applicant_documents_applicant_id_recruitment_applicants_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `recruitment_applicants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_ad_applicant_id` ON `applicant_documents` (`applicant_id`);--> statement-breakpoint
ALTER TABLE `pds_education` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_eligibility` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_family` DROP COLUMN `mobile_no`;--> statement-breakpoint
ALTER TABLE `pds_family` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_learning_development` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_other_info` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `religion`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `nationality`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `umid_number`;--> statement-breakpoint
ALTER TABLE `pds_personal_information` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_references` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_voluntary_work` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `pds_work_experience` DROP COLUMN `updated_at`;--> statement-breakpoint
CREATE OR REPLACE ALGORITHM = undefined
SQL SECURITY definer
VIEW `employee_directory` AS (select `a`.`id` AS `id`,`a`.`employee_id` AS `employee_id`,`a`.`rfid_card_uid` AS `rfid_card_uid`,`a`.`first_name` AS `first_name`,`a`.`last_name` AS `last_name`,concat(`a`.`last_name`,', ',`a`.`first_name`) AS `full_name`,`a`.`email` AS `email`,`a`.`role` AS `role`,`a`.`job_title` AS `job_title`,`a`.`employment_status` AS `employment_status`,`a`.`avatar_url` AS `avatar_url`,`d`.`id` AS `department_id`,`d`.`name` AS `department_name`,`d`.`location` AS `department_location`,`a`.`phone_number` AS `phone_number`,`a`.`position_title` AS `position_title` from (`chrmo_db`.`authentication` `a` left join `chrmo_db`.`departments` `d` on((`a`.`department_id` = `d`.`id`))) where (`a`.`employment_status` <> 'Terminated'));