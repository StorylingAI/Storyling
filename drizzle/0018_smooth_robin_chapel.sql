ALTER TABLE `collections` ADD `share_token` varchar(64);--> statement-breakpoint
ALTER TABLE `collections` ADD `is_public` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD CONSTRAINT `collections_share_token_unique` UNIQUE(`share_token`);