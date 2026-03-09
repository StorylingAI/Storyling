ALTER TABLE `generated_content` ADD `progress` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `generated_content` ADD `progress_stage` varchar(100);