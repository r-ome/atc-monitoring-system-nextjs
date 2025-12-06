/*
  Warnings:

  - A unique constraint covering the columns `[inventory_id]` on the table `auctions_inventories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `auctions_inventories_inventory_id_key` ON `auctions_inventories`(`inventory_id`);
