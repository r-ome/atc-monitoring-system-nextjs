/*
  Warnings:

  - You are about to alter the column `payment_type` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `payments` MODIFY `payment_type` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `fk_inventory_histories_receipt_records` ON `inventory_histories`(`receipt_id`);

-- CreateIndex
CREATE INDEX `fk_payments_payment_method` ON `payments`(`payment_method_id`);

-- CreateIndex
CREATE INDEX `fk_receipt_records_auction_bidders` ON `receipt_records`(`auction_bidder_id`);
