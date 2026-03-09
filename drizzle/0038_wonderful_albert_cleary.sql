CREATE TABLE `breadcrumb_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`show_icons` boolean NOT NULL DEFAULT true,
	`compact_mode` boolean NOT NULL DEFAULT false,
	`hide_on_mobile` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breadcrumb_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `breadcrumb_preferences_user_id_unique` UNIQUE(`user_id`)
);
