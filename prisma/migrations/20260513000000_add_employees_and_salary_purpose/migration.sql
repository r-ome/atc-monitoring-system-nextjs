-- AlterTable: add SALARY to expense_purpose
ALTER TABLE `expenses` MODIFY `purpose` ENUM('ADD_PETTY_CASH', 'EXPENSE', 'SALARY') NOT NULL;

-- AlterTable: add employee_id FK column
ALTER TABLE `expenses` ADD COLUMN `employee_id` VARCHAR(191) NULL;

-- CreateTable: employees
CREATE TABLE `employees` (
  `employee_id` VARCHAR(191) NOT NULL,
  `first_name` VARCHAR(191) NOT NULL,
  `middle_name` VARCHAR(191) NULL,
  `last_name` VARCHAR(191) NOT NULL,
  `position` VARCHAR(191) NULL,
  `employee_type` ENUM('REGULAR', 'CONTRACTUAL') NOT NULL DEFAULT 'REGULAR',
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `contact_number` VARCHAR(191) NULL,
  `remarks` TEXT NULL,
  `branch_id` VARCHAR(191) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `deleted_at` DATETIME(0) NULL,

  PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `fk_employees_branches` ON `employees`(`branch_id`);

-- CreateIndex
CREATE INDEX `fk_expenses_employees` ON `expenses`(`employee_id`);
