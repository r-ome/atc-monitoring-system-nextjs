-- AlterTable
ALTER TABLE `auctions` MODIFY `branch_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bidders` MODIFY `branch_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `auctions_branch_id_idx` ON `auctions`(`branch_id`);

-- CreateIndex
CREATE INDEX `bidders_branch_id_idx` ON `bidders`(`branch_id`);
