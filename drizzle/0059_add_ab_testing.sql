CREATE TABLE `ab_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`experiment_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignment_id` int NOT NULL,
	`user_id` int NOT NULL,
	`experiment_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_experiments_id` PRIMARY KEY(`id`),
	CONSTRAINT `ab_experiments_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `ab_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_id` int NOT NULL,
	`variant_key` varchar(50) NOT NULL,
	`label` varchar(255) NOT NULL,
	`payload` json,
	`weight` int NOT NULL DEFAULT 50,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_variants_id` PRIMARY KEY(`id`)
);
