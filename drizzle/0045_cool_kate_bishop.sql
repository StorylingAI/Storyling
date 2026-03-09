CREATE TABLE `collection_clone_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`clone_date` date NOT NULL,
	`clone_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_clone_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_share_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`user_id` int,
	`platform` enum('twitter','linkedin','facebook','copy_link') NOT NULL,
	`shared_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_share_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_view_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`view_date` date NOT NULL,
	`view_count` int NOT NULL DEFAULT 0,
	`unique_viewers` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collection_view_analytics_id` PRIMARY KEY(`id`)
);
