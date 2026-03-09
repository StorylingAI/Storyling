CREATE TABLE `word_mastery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`word` varchar(255) NOT NULL,
	`target_language` varchar(50) NOT NULL,
	`easiness_factor` int NOT NULL DEFAULT 2500,
	`interval` int NOT NULL DEFAULT 0,
	`repetitions` int NOT NULL DEFAULT 0,
	`next_review_date` timestamp NOT NULL DEFAULT (now()),
	`last_reviewed_at` timestamp,
	`correct_count` int NOT NULL DEFAULT 0,
	`incorrect_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `word_mastery_id` PRIMARY KEY(`id`)
);
