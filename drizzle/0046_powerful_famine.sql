CREATE TABLE `collection_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`badge_type` enum('trending','top_100','community_favorite','rising_star','viral','evergreen') NOT NULL,
	`awarded_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `collection_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(20) DEFAULT '#8B5CF6',
	`display_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `collection_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `collection_category_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`category_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_category_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`tag_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_tag_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`usage_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `collection_tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `email_digest_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`last_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_digest_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_digest_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_digest_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`digest_date` date NOT NULL,
	`total_views` int NOT NULL DEFAULT 0,
	`total_clones` int NOT NULL DEFAULT 0,
	`total_shares` int NOT NULL DEFAULT 0,
	`new_followers` int NOT NULL DEFAULT 0,
	`top_collection_id` int,
	`milestones_reached` json,
	`email_sent` boolean NOT NULL DEFAULT false,
	`email_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_digest_history_id` PRIMARY KEY(`id`)
);
