CREATE TABLE `daily_usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`date_key` varchar(10) NOT NULL,
	`lookup_count` int NOT NULL DEFAULT 0,
	`vocab_save_count` int NOT NULL DEFAULT 0,
	`story_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64);