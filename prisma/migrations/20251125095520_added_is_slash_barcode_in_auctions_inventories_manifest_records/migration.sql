-- AlterTable
ALTER TABLE `auctions_inventories` ADD COLUMN `is_slash_item` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `manifest_records` ADD COLUMN `is_slash_item` VARCHAR(191) NULL;
