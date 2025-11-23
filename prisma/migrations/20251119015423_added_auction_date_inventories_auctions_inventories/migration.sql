/*
  Warnings:

  - Made the column `auction_date` on table `auctions_inventories` required. This step will fail if there are existing NULL values in that column.

*/
ALTER TABLE auctions_inventories
  MODIFY auction_date DATETIME(3) NOT NULL;