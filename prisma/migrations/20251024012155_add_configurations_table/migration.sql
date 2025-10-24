-- CreateTable
CREATE TABLE `configurations` (
    `configuration_id` VARCHAR(191) NOT NULL,
    `payment_term` INTEGER NOT NULL DEFAULT 7,

    PRIMARY KEY (`configuration_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
