ALTER TABLE `collections` ADD `is_featured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `featured_at` timestamp;--> statement-breakpoint
ALTER TABLE `collections` ADD `featured_until` timestamp;