ALTER TABLE `users` ADD `weekly_goal` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `weekly_progress` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `week_start_date` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `weekly_goal_email_sent` boolean DEFAULT false NOT NULL;