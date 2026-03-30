CREATE TABLE `tone_mastery_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tone` int NOT NULL,
	`total_attempts` int NOT NULL DEFAULT 0,
	`correct_attempts` int NOT NULL DEFAULT 0,
	`accuracy_percentage` float NOT NULL DEFAULT 0,
	`last_practiced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tone_mastery_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tone_practice_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`character` varchar(10) NOT NULL,
	`pinyin` varchar(20) NOT NULL,
	`correct_tone` int NOT NULL,
	`selected_tone` int NOT NULL,
	`is_correct` boolean NOT NULL,
	`response_time_ms` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tone_practice_history_id` PRIMARY KEY(`id`)
);
