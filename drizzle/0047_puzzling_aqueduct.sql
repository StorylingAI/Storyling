CREATE TABLE `digest_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_type` enum('weekly_digest','story_highlights') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`scheduled_for` timestamp NOT NULL,
	`started_at` timestamp,
	`completed_at` timestamp,
	`total_users` int NOT NULL DEFAULT 0,
	`processed_users` int NOT NULL DEFAULT 0,
	`success_count` int NOT NULL DEFAULT 0,
	`failure_count` int NOT NULL DEFAULT 0,
	`error_log` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `digest_jobs_id` PRIMARY KEY(`id`)
);
