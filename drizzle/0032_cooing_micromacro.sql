CREATE TABLE `recently_viewed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_type` enum('story','collection','wordbank') NOT NULL,
	`item_id` int NOT NULL,
	`item_title` varchar(500),
	`item_thumbnail` text,
	`viewed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recently_viewed_id` PRIMARY KEY(`id`)
);
