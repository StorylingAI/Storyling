ALTER TABLE `generated_content` ADD `retry_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `generated_content` ADD `last_retry_at` timestamp;--> statement-breakpoint
ALTER TABLE `generated_content` ADD `failure_reason` text;