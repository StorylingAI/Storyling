CREATE TABLE `level_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_language` varchar(50) NOT NULL,
	`proficiency_level` enum('beginner','intermediate','advanced') NOT NULL,
	`score` int NOT NULL,
	`total_questions` int NOT NULL,
	`correct_answers` int NOT NULL,
	`test_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `level_test_results_id` PRIMARY KEY(`id`)
);
