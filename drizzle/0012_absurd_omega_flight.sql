CREATE TABLE `dismissed_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`wordbank_id` int NOT NULL,
	`dismissed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dismissed_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_stats` ADD `mastery_suggestions_snooze_until` timestamp;