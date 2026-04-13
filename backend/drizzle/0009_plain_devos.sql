ALTER TABLE `attendance_logs` ADD `bio_log_id` bigint;--> statement-breakpoint
ALTER TABLE `leave_applications` ADD `is_half_day` boolean DEFAULT false NOT NULL;