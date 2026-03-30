CREATE TABLE `story_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content_id` int NOT NULL,
	`current_sentence` int NOT NULL DEFAULT 0,
	`current_time` float NOT NULL DEFAULT 0,
	`total_duration` float NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`last_watched_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_progress_id` PRIMARY KEY(`id`)
);
