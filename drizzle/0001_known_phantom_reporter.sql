CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`vocabulary_list_id` int NOT NULL,
	`mode` enum('podcast','film') NOT NULL,
	`theme` varchar(100) NOT NULL,
	`voice_type` varchar(100),
	`cinematic_style` varchar(100),
	`story_text` text NOT NULL,
	`audio_url` text,
	`video_url` text,
	`transcript` text,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	`play_count` int NOT NULL DEFAULT 0,
	`last_played_at` timestamp,
	CONSTRAINT `generated_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_language` varchar(50) NOT NULL,
	`total_words_learned` int NOT NULL DEFAULT 0,
	`total_stories_generated` int NOT NULL DEFAULT 0,
	`total_time_spent` int NOT NULL DEFAULT 0,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`last_activity_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vocabulary_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_language` varchar(50) NOT NULL,
	`proficiency_level` varchar(10) NOT NULL,
	`words` text NOT NULL,
	`topic_prompt` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vocabulary_lists_id` PRIMARY KEY(`id`)
);
