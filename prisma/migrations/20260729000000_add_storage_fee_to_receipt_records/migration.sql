-- A storage fee bundled into a pull-out is a charge, not a tender: the bidder
-- settles it with the same bank transfers that pay for the items. Recording it
-- as its own payment row forced the real transfer amounts to be shaved down to
-- make room for it, so no row in the cash flow report matched the bank
-- statement. It now lives on the receipt instead, leaving `payments` to hold
-- only amounts that actually moved.
--
-- Storage fees added AFTER a receipt is settled are untouched -- those are
-- genuinely separate transfers and keep their own STORAGE_FEE receipt.

-- AlterTable
ALTER TABLE `receipt_records`
  ADD COLUMN `storage_fee` INT NOT NULL DEFAULT 0;
