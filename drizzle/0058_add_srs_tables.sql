CREATE TABLE `review_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`srs_review_id` int NOT NULL,
	`user_id` int NOT NULL,
	`word_id` int NOT NULL,
	`quality` int NOT NULL,
	`response_type` varchar(20) NOT NULL,
	`ease_factor_before` float NOT NULL,
	`ease_factor_after` float NOT NULL,
	`interval_before` int NOT NULL,
	`interval_after` int NOT NULL,
	`reviewed_at` timestamp NOT NULL DEFAULT (now()),
	`time_spent_ms` int,
	CONSTRAINT `review_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`daily_reminder_time` varchar(5) DEFAULT '09:00',
	`email_reminders` boolean NOT NULL DEFAULT true,
	`push_reminders` boolean NOT NULL DEFAULT true,
	`last_reminder_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_reminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_reminders_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `srs_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`word_id` int NOT NULL,
	`ease_factor` float NOT NULL DEFAULT 2.5,
	`interval` int NOT NULL DEFAULT 1,
	`repetitions` int NOT NULL DEFAULT 0,
	`last_reviewed_at` timestamp,
	`next_review_at` timestamp NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'learning',
	`is_lapsed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srs_reviews_id` PRIMARY KEY(`id`)
);
