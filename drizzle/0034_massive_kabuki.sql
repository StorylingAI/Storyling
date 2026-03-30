CREATE TABLE `voice_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_language` varchar(50) NOT NULL,
	`voice_type` varchar(100) NOT NULL,
	`narrator_gender` enum('male','female') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_favorites_id` PRIMARY KEY(`id`)
);
