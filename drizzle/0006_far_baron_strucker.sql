CREATE TABLE `enrollment_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`token` varchar(64) NOT NULL,
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`invited_at` timestamp NOT NULL DEFAULT (now()),
	`accepted_at` timestamp,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `enrollment_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_invitations_token_unique` UNIQUE(`token`)
);
