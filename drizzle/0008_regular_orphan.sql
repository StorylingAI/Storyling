ALTER TABLE `generated_content` ADD `narrator_gender` enum('male','female');--> statement-breakpoint
ALTER TABLE `generated_content` ADD `line_translations` json;--> statement-breakpoint
ALTER TABLE `generated_content` ADD `vocabulary_translations` json;