ALTER TABLE `wordbank` ADD `next_review_date` timestamp;--> statement-breakpoint
ALTER TABLE `wordbank` ADD `ease_factor` float DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE `wordbank` ADD `interval` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `wordbank` ADD `repetitions` int DEFAULT 0 NOT NULL;