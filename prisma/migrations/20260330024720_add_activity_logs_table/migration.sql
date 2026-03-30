-- CreateTable
CREATE TABLE `activity_logs` (
    `activity_log_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `branch_name` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `activity_logs_branch_id_idx`(`branch_id`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    INDEX `activity_logs_entity_type_idx`(`entity_type`),
    PRIMARY KEY (`activity_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
