CREATE TABLE `watch_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content_id` int NOT NULL,
	`watched_at` timestamp NOT NULL DEFAULT (now()),
	`duration` float NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`progress_percentage` float NOT NULL DEFAULT 0,
	CONSTRAINT `watch_history_id` PRIMARY KEY(`id`)
);
