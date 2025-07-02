-- CreateTable
CREATE TABLE `auctions` (
    `auction_id` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`auction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auctions_bidders` (
    `auction_bidder_id` VARCHAR(191) NOT NULL,
    `auction_id` VARCHAR(191) NOT NULL,
    `bidder_id` VARCHAR(191) NOT NULL,
    `service_charge` INTEGER NOT NULL DEFAULT 0,
    `already_consumed` TINYINT NOT NULL DEFAULT 0,
    `registration_fee` INTEGER NOT NULL DEFAULT 0,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `remarks` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_auctions_bidders_auctions`(`auction_id`),
    INDEX `fk_auctions_bidders_bidders`(`bidder_id`),
    PRIMARY KEY (`auction_bidder_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auctions_inventories` (
    `auction_inventory_id` VARCHAR(191) NOT NULL,
    `auction_bidder_id` VARCHAR(191) NOT NULL,
    `inventory_id` VARCHAR(191) NOT NULL,
    `receipt_id` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('PAID', 'UNPAID', 'CANCELLED', 'REFUNDED', 'DISCREPANCY') NOT NULL DEFAULT 'UNPAID',
    `price` INTEGER NOT NULL DEFAULT 0,
    `qty` VARCHAR(191) NOT NULL,
    `manifest_number` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_auctions_inventories_auctions_bidders`(`auction_bidder_id`),
    INDEX `fk_auctions_inventories_inventories`(`inventory_id`),
    INDEX `fk_auctions_inventories_receipt`(`receipt_id`),
    PRIMARY KEY (`auction_inventory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidder_requirements` (
    `requirement_id` VARCHAR(191) NOT NULL,
    `bidder_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `validity_date` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_bidder_requirements_bidders`(`bidder_id`),
    PRIMARY KEY (`requirement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidders` (
    `bidder_id` VARCHAR(191) NOT NULL,
    `bidder_number` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `middle_name` VARCHAR(191) NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `birthdate` DATETIME NULL,
    `contact_number` VARCHAR(191) NULL,
    `registration_fee` INTEGER NOT NULL DEFAULT 0,
    `service_charge` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('BANNED', 'ACTIVE', 'INACTIVE') NOT NULL,
    `remarks` TEXT NULL,
    `registered_at` VARCHAR(191) NOT NULL DEFAULT 'BIÑAN',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `bidders_bidder_number_key`(`bidder_number`),
    PRIMARY KEY (`bidder_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bidder_ban_histories` (
    `bidder_ban_history_id` VARCHAR(191) NOT NULL,
    `bidder_id` VARCHAR(191) NOT NULL,
    `remarks` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_bidder_ban_histories_bidders`(`bidder_id`),
    PRIMARY KEY (`bidder_ban_history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `branch_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `containers` (
    `container_id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `bill_of_lading_number` VARCHAR(255) NULL,
    `container_number` VARCHAR(191) NULL,
    `eta_to_ph` DATETIME(0) NULL,
    `departure_date` DATETIME(0) NULL,
    `arrival_date` DATETIME(0) NULL,
    `auction_start_date` DATETIME(0) NULL,
    `auction_end_date` DATETIME(0) NULL,
    `due_date` DATETIME(0) NULL,
    `gross_weight` VARCHAR(255) NULL,
    `auction_or_sell` ENUM('AUCTION', 'SELL') NOT NULL DEFAULT 'SELL',
    `status` ENUM('PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `containers_barcode_key`(`barcode`),
    INDEX `fk_containers_branches`(`branch_id`),
    INDEX `fk_containers_suppliers`(`supplier_id`),
    PRIMARY KEY (`container_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventories` (
    `inventory_id` VARCHAR(191) NOT NULL,
    `container_id` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `control` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('SOLD', 'UNSOLD', 'BOUGHT_ITEM', 'VOID') NOT NULL DEFAULT 'UNSOLD',
    `is_bought_item` INTEGER NULL,
    `url` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_inventories_container_id`(`container_id`),
    PRIMARY KEY (`inventory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_histories` (
    `inventory_history_id` VARCHAR(191) NOT NULL,
    `auction_inventory_id` VARCHAR(191) NULL,
    `inventory_id` VARCHAR(191) NOT NULL,
    `receipt_id` VARCHAR(191) NULL,
    `auction_status` ENUM('PAID', 'UNPAID', 'CANCELLED', 'REFUNDED', 'DISCREPANCY') NOT NULL,
    `inventory_status` ENUM('SOLD', 'UNSOLD', 'BOUGHT_ITEM', 'VOID') NOT NULL,
    `remarks` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_inventory_histories_auctions_inventories`(`auction_inventory_id`),
    INDEX `fk_inventory_histories_inventory`(`inventory_id`),
    PRIMARY KEY (`inventory_history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manifest_records` (
    `manifest_id` VARCHAR(191) NOT NULL,
    `auction_id` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NULL,
    `control` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `price` VARCHAR(191) NULL,
    `bidder_number` VARCHAR(191) NULL,
    `qty` VARCHAR(191) NULL,
    `manifest_number` VARCHAR(191) NULL,
    `remarks` TEXT NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `fk_manifest_records_auctions`(`auction_id`),
    PRIMARY KEY (`manifest_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receipt_records` (
    `receipt_id` VARCHAR(191) NOT NULL,
    `receipt_number` VARCHAR(191) NOT NULL,
    `auction_bidder_id` VARCHAR(191) NOT NULL,
    `purpose` ENUM('REGISTRATION', 'PULL_OUT', 'REFUNDED', 'LESS') NOT NULL DEFAULT 'REGISTRATION',
    `remarks` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`receipt_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `payment_id` VARCHAR(191) NOT NULL,
    `receipt_id` VARCHAR(191) NOT NULL,
    `amount_paid` INTEGER NOT NULL DEFAULT 0,
    `payment_type` ENUM('CASH', 'BDO', 'BPI', 'GCASH') NOT NULL DEFAULT 'CASH',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `fk_payments_receipt`(`receipt_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `supplier_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `supplier_code` VARCHAR(191) NOT NULL,
    `japanese_name` VARCHAR(255) NULL,
    `commission` VARCHAR(191) NULL,
    `sales_remittance_account` VARCHAR(191) NULL,
    `shipper` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `contact_number` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `name`(`name`),
    UNIQUE INDEX `supplier_code`(`supplier_code`),
    PRIMARY KEY (`supplier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'OWNER', 'CASHIER', 'ENCODER') NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `expense_id` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `amount` INTEGER NOT NULL DEFAULT 0,
    `purpose` ENUM('ADD_PETTY_CASH', 'EXPENSE') NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`expense_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
