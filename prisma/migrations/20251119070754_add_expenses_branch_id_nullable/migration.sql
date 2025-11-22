-- AlterTable
ALTER TABLE `expenses` MODIFY `branch_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `expenses_branch_id_idx` ON `expenses`(`branch_id`);
