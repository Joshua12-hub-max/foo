ALTER TABLE `recruitment_applicants` ADD `start_date` datetime;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `is_confirmed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `is_registered` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `recruitment_applicants` ADD `registered_employee_id` varchar(50);