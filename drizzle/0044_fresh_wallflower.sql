CREATE TABLE `collection_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` int NOT NULL,
	`milestone_type` varchar(50) NOT NULL,
	`achieved_at` timestamp NOT NULL DEFAULT (now()),
	`notification_sent` boolean NOT NULL DEFAULT false,
	`notification_sent_at` timestamp,
	CONSTRAINT `collection_milestones_id` PRIMARY KEY(`id`)
);
