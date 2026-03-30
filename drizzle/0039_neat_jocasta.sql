CREATE TABLE `vocabulary_collection_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`collection_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vocabulary_collection_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vocabulary_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`slug` varchar(255) NOT NULL,
	`target_language` varchar(50) NOT NULL,
	`proficiency_level` varchar(10) NOT NULL,
	`category` varchar(100),
	`tags` text,
	`words` json NOT NULL,
	`word_count` int NOT NULL DEFAULT 0,
	`is_public` boolean NOT NULL DEFAULT false,
	`is_featured` boolean NOT NULL DEFAULT false,
	`view_count` int NOT NULL DEFAULT 0,
	`clone_count` int NOT NULL DEFAULT 0,
	`like_count` int NOT NULL DEFAULT 0,
	`meta_title` varchar(255),
	`meta_description` text,
	`meta_keywords` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vocabulary_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `vocabulary_collections_slug_unique` UNIQUE(`slug`)
);
