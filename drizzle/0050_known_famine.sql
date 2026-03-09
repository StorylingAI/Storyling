ALTER TABLE `users` ADD `weekly_goal_streak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_week_goal_reached` boolean DEFAULT false NOT NULL;