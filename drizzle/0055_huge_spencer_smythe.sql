CREATE TABLE `affiliate_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referral_code_id` int NOT NULL,
	`affiliate_user_id` int NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer_url` text,
	`landing_page` varchar(500),
	`converted` boolean NOT NULL DEFAULT false,
	`converted_user_id` int,
	`clicked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_user_id` int NOT NULL,
	`referral_code_id` int NOT NULL,
	`referred_user_id` int NOT NULL,
	`conversion_type` enum('signup','premium_monthly','premium_annual') NOT NULL,
	`commission_amount` decimal(10,2) NOT NULL,
	`commission_percent` int NOT NULL,
	`subscription_amount` decimal(10,2),
	`payout_status` enum('pending','processing','paid','failed') NOT NULL DEFAULT 'pending',
	`paid_at` timestamp,
	`payment_method` varchar(50),
	`payment_reference` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_user_id` int NOT NULL,
	`requested_amount` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','processing','completed','rejected') NOT NULL DEFAULT 'pending',
	`payment_method` varchar(50) NOT NULL,
	`payment_details` text,
	`processed_at` timestamp,
	`completed_at` timestamp,
	`rejection_reason` text,
	`transaction_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_payouts_id` PRIMARY KEY(`id`)
);
