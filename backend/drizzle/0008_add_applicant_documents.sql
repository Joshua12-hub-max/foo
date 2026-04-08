-- Migration: Add applicant_documents table
-- Created: 2026-04-08

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

ALTER TABLE `applicant_documents` ADD CONSTRAINT `applicant_documents_applicant_id_recruitment_applicants_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `recruitment_applicants`(`id`) ON DELETE cascade ON UPDATE no action;

CREATE INDEX `idx_ad_applicant_id` ON `applicant_documents` (`applicant_id`);
