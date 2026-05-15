-- AlterTable: employees — add payroll & personal fields
ALTER TABLE `employees`
  ADD COLUMN `birthday`                 DATE NULL,
  ADD COLUMN `date_hired`               DATE NULL,
  ADD COLUMN `address`                  TEXT NULL,
  ADD COLUMN `tin`                      VARCHAR(191) NULL,
  ADD COLUMN `sss_number`               VARCHAR(191) NULL,
  ADD COLUMN `philhealth_number`        VARCHAR(191) NULL,
  ADD COLUMN `pagibig_number`           VARCHAR(191) NULL,
  ADD COLUMN `emergency_contact_name`   VARCHAR(191) NULL,
  ADD COLUMN `emergency_contact_number` VARCHAR(191) NULL,
  ADD COLUMN `salary_type`              ENUM('FIXED_MONTHLY','DAILY_RATE','TASK_BASED') NOT NULL DEFAULT 'DAILY_RATE',
  ADD COLUMN `worker_type`              ENUM('REGULAR_WORKER','EXTRA_WORKER') NOT NULL DEFAULT 'REGULAR_WORKER',
  ADD COLUMN `declaration_status`       ENUM('DECLARED','NON_DECLARED') NOT NULL DEFAULT 'DECLARED',
  ADD COLUMN `default_daily_rate`       DECIMAL(12,2) NULL,
  ADD COLUMN `default_monthly_salary`   DECIMAL(12,2) NULL,
  ADD COLUMN `default_auction_rate`     DECIMAL(12,2) NULL,
  ADD COLUMN `default_container_rate`   DECIMAL(12,2) NULL,
  ADD COLUMN `default_ot_hour_rate`     DECIMAL(10,4) NULL,
  ADD COLUMN `default_ot_minute_rate`   DECIMAL(10,4) NULL;

-- CreateIndex on employees
CREATE INDEX `idx_employees_status` ON `employees`(`status`);
CREATE INDEX `idx_employees_worker_type` ON `employees`(`worker_type`);

-- CreateTable: employee_employment_events
CREATE TABLE `employee_employment_events` (
  `event_id`       VARCHAR(191)  NOT NULL,
  `employee_id`    VARCHAR(191)  NOT NULL,
  `event_type`     ENUM('RESIGNED','TERMINATED','AWOL','END_OF_CONTRACT','REHIRED','RECALLED') NOT NULL,
  `effective_date` DATE          NOT NULL,
  `remarks`        TEXT          NULL,
  `created_at`     TIMESTAMP(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at`     DATETIME(0)   NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `deleted_at`     DATETIME(0)   NULL,
  PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_employment_events_employee_date` ON `employee_employment_events`(`employee_id`, `effective_date`);

-- CreateTable: payroll_periods
CREATE TABLE `payroll_periods` (
  `payroll_period_id` VARCHAR(191)  NOT NULL,
  `branch_id`         VARCHAR(191)  NOT NULL,
  `label`             VARCHAR(191)  NOT NULL,
  `period_start`      DATE          NOT NULL,
  `period_end`        DATE          NOT NULL,
  `pay_date`          DATE          NULL,
  `status`            ENUM('DRAFT','POSTED','VOID') NOT NULL DEFAULT 'DRAFT',
  `posted_at`         DATETIME(0)   NULL,
  `posted_by`         VARCHAR(191)  NULL,
  `remarks`           TEXT          NULL,
  `created_at`        TIMESTAMP(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at`        DATETIME(0)   NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `deleted_at`        DATETIME(0)   NULL,
  PRIMARY KEY (`payroll_period_id`),
  UNIQUE KEY `uq_payroll_periods_branch_dates` (`branch_id`, `period_start`, `period_end`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_payroll_periods_branch_end` ON `payroll_periods`(`branch_id`, `period_end`);
CREATE INDEX `idx_payroll_periods_status` ON `payroll_periods`(`status`);

-- CreateTable: payroll_entries
CREATE TABLE `payroll_entries` (
  `payroll_entry_id`        VARCHAR(191)  NOT NULL,
  `payroll_period_id`       VARCHAR(191)  NOT NULL,
  `employee_id`             VARCHAR(191)  NOT NULL,
  `name_snapshot`           VARCHAR(191)  NOT NULL,
  `position_snapshot`       VARCHAR(191)  NULL,
  `salary_type_snapshot`    ENUM('FIXED_MONTHLY','DAILY_RATE','TASK_BASED') NOT NULL,
  `worker_type_snapshot`    ENUM('REGULAR_WORKER','EXTRA_WORKER') NOT NULL,
  `declaration_status_snapshot` ENUM('DECLARED','NON_DECLARED') NOT NULL DEFAULT 'DECLARED',
  `daily_rate_snapshot`     DECIMAL(12,2) NULL,
  `monthly_salary_snapshot` DECIMAL(12,2) NULL,
  `auction_rate_snapshot`   DECIMAL(12,2) NULL,
  `ot_hour_rate_snapshot`   DECIMAL(10,4) NULL,
  `ot_minute_rate_snapshot` DECIMAL(10,4) NULL,
  `ot_rate_is_manual`       TINYINT(1)    NOT NULL DEFAULT 0,
  `sss_snapshot`            VARCHAR(191)  NULL,
  `philhealth_snapshot`     VARCHAR(191)  NULL,
  `pagibig_snapshot`        VARCHAR(191)  NULL,
  `tin_snapshot`            VARCHAR(191)  NULL,
  `days_worked`             DECIMAL(6,2)  NOT NULL DEFAULT 0,
  `days_leave_paid`         DECIMAL(6,2)  NOT NULL DEFAULT 0,
  `ot_hours`                DECIMAL(6,2)  NOT NULL DEFAULT 0,
  `ot_minutes`              DECIMAL(6,2)  NOT NULL DEFAULT 0,
  `worked_dates`            JSON          NULL,
  `basic_pay`               DECIMAL(12,2) NOT NULL DEFAULT 0,
  `gross_pay`               DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total_deductions`        DECIMAL(12,2) NOT NULL DEFAULT 0,
  `net_pay`                 DECIMAL(12,2) NOT NULL DEFAULT 0,
  `expense_id`              VARCHAR(191)  NULL,
  `remarks`                 TEXT          NULL,
  `created_at`              TIMESTAMP(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at`              DATETIME(0)   NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `deleted_at`              DATETIME(0)   NULL,
  PRIMARY KEY (`payroll_entry_id`),
  UNIQUE KEY `uq_payroll_entries_period_employee` (`payroll_period_id`, `employee_id`),
  UNIQUE KEY `uq_payroll_entries_expense` (`expense_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_payroll_entries_employee` ON `payroll_entries`(`employee_id`);
CREATE INDEX `idx_payroll_entries_period` ON `payroll_entries`(`payroll_period_id`);
CREATE INDEX `idx_payroll_entries_expense` ON `payroll_entries`(`expense_id`);

-- CreateTable: payroll_earnings
CREATE TABLE `payroll_earnings` (
  `payroll_earning_id` VARCHAR(191)  NOT NULL,
  `payroll_entry_id`   VARCHAR(191)  NOT NULL,
  `type`               ENUM('BASIC_PAY','OVERTIME_HOUR','OVERTIME_MINUTE','AUCTION','CONTAINER','LEAVE_WITH_PAY','HOLIDAY','SSS_ALLOWANCE','PHILHEALTH_ALLOWANCE','PAGIBIG_ALLOWANCE','OTHER_EARNING') NOT NULL,
  `amount`             DECIMAL(12,2) NOT NULL DEFAULT 0,
  `quantity`           DECIMAL(10,4) NULL,
  `rate`               DECIMAL(10,4) NULL,
  `remarks`            VARCHAR(191)  NULL,
  `created_at`         TIMESTAMP(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at`         DATETIME(0)   NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`payroll_earning_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_payroll_earnings_entry` ON `payroll_earnings`(`payroll_entry_id`);

-- CreateTable: payroll_deductions
CREATE TABLE `payroll_deductions` (
  `payroll_deduction_id` VARCHAR(191)  NOT NULL,
  `payroll_entry_id`     VARCHAR(191)  NOT NULL,
  `type`                 ENUM('SSS','PHILHEALTH','PAGIBIG','PAGIBIG_LOAN','SLC','LATE','UNDERTIME','OTHER_DEDUCTION') NOT NULL,
  `amount`               DECIMAL(12,2) NOT NULL DEFAULT 0,
  `remarks`              VARCHAR(191)  NULL,
  `created_at`           TIMESTAMP(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at`           DATETIME(0)   NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`payroll_deduction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_payroll_deductions_entry` ON `payroll_deductions`(`payroll_entry_id`);
