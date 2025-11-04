-- CreateTable
CREATE TABLE `counter_check` (
    `counter_check_id` VARCHAR(191) NOT NULL,
    `auction_id` VARCHAR(191) NOT NULL,
    `control` VARCHAR(191) NULL,
    `bidder_number` VARCHAR(191) NULL,
    `price` VARCHAR(191) NULL,
    `page` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_counter_check_auctions`(`auction_id`),
    PRIMARY KEY (`counter_check_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
