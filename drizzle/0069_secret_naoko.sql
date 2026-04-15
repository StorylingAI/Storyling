CREATE TEMPORARY TABLE `daily_usage_tracking_rollup` AS
SELECT
  MIN(`id`) AS `keep_id`,
  `user_id`,
  `date_key`,
  SUM(`lookup_count`) AS `lookup_count`,
  SUM(`vocab_save_count`) AS `vocab_save_count`,
  SUM(`story_count`) AS `story_count`
FROM `daily_usage_tracking`
GROUP BY `user_id`, `date_key`
HAVING COUNT(*) > 1;
--> statement-breakpoint
UPDATE `daily_usage_tracking` AS `dut`
JOIN `daily_usage_tracking_rollup` AS `rollup`
  ON `dut`.`id` = `rollup`.`keep_id`
SET
  `dut`.`lookup_count` = `rollup`.`lookup_count`,
  `dut`.`vocab_save_count` = `rollup`.`vocab_save_count`,
  `dut`.`story_count` = `rollup`.`story_count`;
--> statement-breakpoint
DELETE `dut`
FROM `daily_usage_tracking` AS `dut`
JOIN `daily_usage_tracking_rollup` AS `rollup`
  ON `dut`.`user_id` = `rollup`.`user_id`
  AND `dut`.`date_key` = `rollup`.`date_key`
  AND `dut`.`id` <> `rollup`.`keep_id`;
--> statement-breakpoint
DROP TEMPORARY TABLE `daily_usage_tracking_rollup`;
--> statement-breakpoint
ALTER TABLE `daily_usage_tracking` ADD CONSTRAINT `daily_usage_tracking_user_date_unique` UNIQUE(`user_id`,`date_key`);
