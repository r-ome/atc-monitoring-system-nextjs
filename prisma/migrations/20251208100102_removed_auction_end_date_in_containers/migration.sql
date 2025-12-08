/*
  Warnings:

  - You are about to drop the column `auction_end_date` on the `containers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `containers` DROP COLUMN `auction_end_date`;
