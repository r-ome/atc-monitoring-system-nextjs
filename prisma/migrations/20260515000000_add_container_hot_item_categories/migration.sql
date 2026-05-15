CREATE TABLE `container_item_categories` (
    `category_id` VARCHAR(191) NOT NULL,
    `container_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_container_item_categories_containers`(`container_id`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `container_item_category_descriptions` (
    `category_description_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `container_id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `normalized_description` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `container_item_category_desc_container_desc_key`(`container_id`, `normalized_description`),
    INDEX `fk_container_item_category_desc_categories`(`category_id`),
    INDEX `fk_container_item_category_desc_containers`(`container_id`),
    PRIMARY KEY (`category_description_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
