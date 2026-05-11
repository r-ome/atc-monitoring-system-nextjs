-- CreateTable
CREATE TABLE `container_files` (
  `container_file_id` VARCHAR(191) NOT NULL,
  `container_id` VARCHAR(191) NOT NULL,
  `document_type` ENUM('CONTAINER_REPORT') NOT NULL,
  `version` INTEGER NOT NULL,
  `original_filename` VARCHAR(191) NOT NULL,
  `s3_bucket` VARCHAR(191) NOT NULL,
  `s3_key` TEXT NOT NULL,
  `content_type` VARCHAR(191) NOT NULL,
  `size_bytes` INTEGER NOT NULL,
  `uploaded_by` VARCHAR(191) NOT NULL,
  `uploaded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `deleted_by` VARCHAR(191) NULL,
  `deleted_at` DATETIME(0) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  PRIMARY KEY (`container_file_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `container_files_container_document_version_key` ON `container_files`(`container_id`, `document_type`, `version`);

-- CreateIndex
CREATE INDEX `container_files_container_document_deleted_idx` ON `container_files`(`container_id`, `document_type`, `deleted_at`);

-- CreateIndex
CREATE INDEX `fk_container_files_containers` ON `container_files`(`container_id`);
