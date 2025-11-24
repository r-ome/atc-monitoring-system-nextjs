-- AlterTable
ALTER TABLE `payments` ADD COLUMN `payment_method_id` VARCHAR(191) NULL,
    ALTER COLUMN `payment_type` DROP DEFAULT;

-- CreateTable
CREATE TABLE `payment_methods` (
    `payment_method_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `state` ENUM('ENABLED', 'DISABLED') NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `payment_methods_name_key`(`name`),
    PRIMARY KEY (`payment_method_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
