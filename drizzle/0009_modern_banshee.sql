CREATE TABLE `wordbank` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`word` text NOT NULL,
	`pinyin` text,
	`translation` text NOT NULL,
	`target_language` varchar(100) NOT NULL,
	`example_sentences` json,
	`audio_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wordbank_id` PRIMARY KEY(`id`)
);
