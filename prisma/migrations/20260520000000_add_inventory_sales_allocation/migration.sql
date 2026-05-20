ALTER TABLE `inventories`
  ADD COLUMN `sales_allocation` ENUM('CONTAINER', 'ATC') NOT NULL DEFAULT 'CONTAINER',
  ADD COLUMN `sales_allocation_reason` ENUM('NORMAL', 'ATC_CONTAINER', 'ENCODED_AFTER_CONTAINER_PAID', 'TRANSFERRED_TO_PAID_CONTAINER', 'PAID_DATE_RECALCULATION', 'MANUAL_OVERRIDE') NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN `sales_allocation_note` TEXT NULL;

CREATE INDEX `inventories_sales_allocation_idx` ON `inventories`(`sales_allocation`);
