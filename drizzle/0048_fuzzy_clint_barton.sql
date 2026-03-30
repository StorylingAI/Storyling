CREATE TABLE `user_digests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`digest_type` enum('weekly_creator','story_highlights') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` json NOT NULL,
	`week_start_date` date,
	`week_end_date` date,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_digests_id` PRIMARY KEY(`id`)
);
