-- Additive only. Historical initialization is a separate, explicitly invoked tool.
ALTER TABLE `bidders`
    ADD COLUMN `last_activity_at` DATETIME(0) NULL,
    ADD INDEX `bidders_branch_status_activity_idx` (`branch_id`, `status`, `last_activity_at`);
