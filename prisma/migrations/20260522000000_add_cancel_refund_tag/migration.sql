-- AlterTable
ALTER TABLE `inventory_histories`
  ADD COLUMN `tag` ENUM(
    'MISSING',
    'DAMAGED',
    'NOT_DECLARED_DAMAGED',
    'WRONG_BIDDER',
    'REBID',
    'DOUBLE_ENCODE',
    'WRONG_ENCODE',
    'NOT_CLAIMED',
    'INVOICE_ERROR',
    'VOIDED',
    'OTHER'
  ) NULL;

-- CreateIndex
CREATE INDEX `idx_inventory_histories_tag` ON `inventory_histories`(`tag`);
