CREATE TABLE IF NOT EXISTS `shift_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`department_id` int,
	`employee_id` varchar(50),
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `name` UNIQUE(`name`)
);
