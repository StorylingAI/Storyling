CREATE TABLE `challenge_reward_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`challenge_key` varchar(64) NOT NULL,
	`period_key` varchar(32) NOT NULL,
	`xp_awarded` int NOT NULL DEFAULT 0,
	`coins_awarded` int NOT NULL DEFAULT 0,
	`claimed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_reward_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_stats` ADD `coins` int DEFAULT 0 NOT NULL;