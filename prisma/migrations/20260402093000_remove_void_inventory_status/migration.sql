UPDATE `inventory_histories`
SET `inventory_status` = 'UNSOLD'
WHERE `inventory_status` = 'VOID';

UPDATE `inventories` i
LEFT JOIN `auctions_inventories` ai
  ON ai.`inventory_id` = i.`inventory_id`
SET i.`status` = CASE
  WHEN ai.`status` IN ('PAID', 'UNPAID', 'PARTIAL', 'DISCREPANCY') THEN 'SOLD'
  ELSE 'UNSOLD'
END
WHERE i.`status` = 'VOID';

ALTER TABLE `inventories`
  MODIFY `status` ENUM('SOLD', 'UNSOLD', 'BOUGHT_ITEM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNSOLD';

ALTER TABLE `inventory_histories`
  MODIFY `inventory_status` ENUM('SOLD', 'UNSOLD', 'BOUGHT_ITEM') COLLATE utf8mb4_unicode_ci NOT NULL;
