CREATE TABLE `cookie_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`necessary` boolean NOT NULL DEFAULT true,
	`analytics` boolean NOT NULL DEFAULT false,
	`marketing` boolean NOT NULL DEFAULT false,
	`preferences` boolean NOT NULL DEFAULT false,
	`consent_date` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cookie_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `cookie_preferences_user_id_unique` UNIQUE(`user_id`)
);
