-- Tier 1: Add indexes on critical columns for performance
-- These prevent full table scans on the most frequently queried columns

-- Users table
ALTER TABLE `users` ADD INDEX `idx_users_email` (`email`);
ALTER TABLE `users` ADD INDEX `idx_users_stripe_customer_id` (`stripe_customer_id`);

-- Generated content
ALTER TABLE `generated_content` ADD INDEX `idx_generated_content_user_id` (`user_id`);

-- Learning progress
ALTER TABLE `learning_progress` ADD INDEX `idx_learning_progress_user_id` (`user_id`);

-- Favorites
ALTER TABLE `favorites` ADD INDEX `idx_favorites_user_id` (`user_id`);
ALTER TABLE `favorites` ADD INDEX `idx_favorites_content_id` (`content_id`);

-- Wordbank
ALTER TABLE `wordbank` ADD INDEX `idx_wordbank_user_id` (`user_id`);

-- Quiz attempts
ALTER TABLE `quiz_attempts` ADD INDEX `idx_quiz_attempts_user_id` (`user_id`);
ALTER TABLE `quiz_attempts` ADD INDEX `idx_quiz_attempts_content_id` (`content_id`);

-- Story progress
ALTER TABLE `story_progress` ADD INDEX `idx_story_progress_user_id` (`user_id`);
ALTER TABLE `story_progress` ADD INDEX `idx_story_progress_content_id` (`content_id`);

-- Watch history
ALTER TABLE `watch_history` ADD INDEX `idx_watch_history_user_id` (`user_id`);
ALTER TABLE `watch_history` ADD INDEX `idx_watch_history_content_id` (`content_id`);

-- Word mastery
ALTER TABLE `word_mastery` ADD INDEX `idx_word_mastery_user_id` (`user_id`);

-- Collections
ALTER TABLE `collections` ADD INDEX `idx_collections_user_id` (`user_id`);
ALTER TABLE `collection_items` ADD INDEX `idx_collection_items_content_id` (`content_id`);

-- Organizations
ALTER TABLE `organization_admins` ADD INDEX `idx_org_admins_org_id` (`organization_id`);
ALTER TABLE `organization_admins` ADD INDEX `idx_org_admins_user_id` (`user_id`);
ALTER TABLE `classes` ADD INDEX `idx_classes_org_id` (`organization_id`);

-- Notifications
ALTER TABLE `notifications` ADD INDEX `idx_notifications_user_id` (`user_id`);

-- Leaderboard
ALTER TABLE `leaderboard_entries` ADD INDEX `idx_leaderboard_user_id` (`user_id`);

-- Referrals
ALTER TABLE `referral_codes` ADD INDEX `idx_referral_codes_user_id` (`user_id`);

-- Batch jobs
ALTER TABLE `batch_jobs` ADD INDEX `idx_batch_jobs_user_id` (`user_id`);
