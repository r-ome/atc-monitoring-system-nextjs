-- AlterTable
ALTER TABLE `bidders` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `store_name` VARCHAR(191) NULL,
    ADD COLUMN `tin_number` VARCHAR(191) NULL;
