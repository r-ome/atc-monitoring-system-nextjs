-- AlterTable
ALTER TABLE `auctions_inventories` ADD COLUMN `auction_date` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `inventories` ADD COLUMN `auction_date` DATETIME(3) NULL;
