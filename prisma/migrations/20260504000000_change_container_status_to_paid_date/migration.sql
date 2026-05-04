ALTER TABLE `containers` ADD COLUMN `status_paid_at` DATE NULL;

UPDATE `containers`
SET `status_paid_at` = CURRENT_DATE()
WHERE `status` = 'PAID';

ALTER TABLE `containers` DROP COLUMN `status`;

ALTER TABLE `containers` CHANGE `status_paid_at` `status` DATE NULL;
