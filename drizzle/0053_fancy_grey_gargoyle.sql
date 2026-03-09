CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`discount_percent` int NOT NULL DEFAULT 20,
	`is_active` boolean NOT NULL DEFAULT true,
	`usage_count` int NOT NULL DEFAULT 0,
	`max_usage` int,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_conversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referral_code_id` int NOT NULL,
	`referrer_id` int NOT NULL,
	`referred_user_id` int NOT NULL,
	`referred_user_email` varchar(320),
	`discount_applied` int NOT NULL,
	`reward_months` int NOT NULL DEFAULT 1,
	`reward_status` enum('pending','applied','expired') NOT NULL DEFAULT 'pending',
	`reward_applied_at` timestamp,
	`subscription_started_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_conversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_months_earned` int NOT NULL DEFAULT 0,
	`months_used` int NOT NULL DEFAULT 0,
	`months_available` int NOT NULL DEFAULT 0,
	`last_reward_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_rewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_rewards_user_id_unique` UNIQUE(`user_id`)
);
