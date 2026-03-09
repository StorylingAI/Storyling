CREATE TABLE `tutorial_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`challenge_id` varchar(100) NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_challenges_id` PRIMARY KEY(`id`)
);
