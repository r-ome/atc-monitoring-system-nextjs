/*
  Warnings:

  - Added the required column `branch_id` to the `auctions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_id` to the `bidders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_id` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `auctions` ADD COLUMN `branch_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `bidders` ADD COLUMN `branch_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `expenses` ADD COLUMN `branch_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `users_branches` (
    `user_id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `users_branches_branch_id_idx`(`branch_id`),
    INDEX `users_branches_user_id_idx`(`user_id`),
    PRIMARY KEY (`user_id`, `branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `receipt_records_auction_bidder_id_idx` ON `receipt_records`(`auction_bidder_id`);
