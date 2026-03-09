CREATE TABLE `practice_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`wordbank_id` int NOT NULL,
	`quiz_mode` varchar(50) NOT NULL,
	`is_correct` boolean NOT NULL,
	`xp_earned` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `wordbank` ADD `mastery_level` varchar(20) DEFAULT 'learning' NOT NULL;--> statement-breakpoint
ALTER TABLE `wordbank` ADD `times_correct` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wordbank` ADD `times_incorrect` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wordbank` ADD `last_practiced_at` timestamp;