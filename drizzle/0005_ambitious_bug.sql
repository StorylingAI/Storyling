CREATE TABLE `assignment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignment_id` int NOT NULL,
	`user_id` int NOT NULL,
	`content_id` int,
	`status` enum('not_started','in_progress','completed','overdue') NOT NULL DEFAULT 'not_started',
	`completed_at` timestamp,
	`submitted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignment_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`content_id` int,
	`vocabulary_list_id` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`due_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`user_id` int NOT NULL,
	`enrolled_at` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','inactive','removed') NOT NULL DEFAULT 'active',
	CONSTRAINT `class_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`target_language` varchar(50) NOT NULL,
	`proficiency_level` varchar(10) NOT NULL,
	`is_archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_admins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('school','university','corporate','other') NOT NULL DEFAULT 'school',
	`contact_email` varchar(320),
	`contact_name` varchar(255),
	`max_students` int NOT NULL DEFAULT 100,
	`max_teachers` int NOT NULL DEFAULT 10,
	`is_active` boolean NOT NULL DEFAULT true,
	`subscription_tier` enum('trial','basic','premium','enterprise') NOT NULL DEFAULT 'trial',
	`subscription_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','teacher','org_admin') NOT NULL DEFAULT 'user';