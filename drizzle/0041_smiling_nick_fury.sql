ALTER TABLE `users` ADD `subscription_tier` enum('free','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_status` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_current_period_end` timestamp;