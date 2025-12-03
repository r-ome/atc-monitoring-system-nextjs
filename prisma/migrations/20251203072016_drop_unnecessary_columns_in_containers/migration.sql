/*
  Warnings:

  - You are about to drop the column `auction_start_date` on the `containers` table. All the data in the column will be lost.
  - You are about to drop the column `departure_date` on the `containers` table. All the data in the column will be lost.
  - You are about to drop the column `eta_to_ph` on the `containers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `containers` DROP COLUMN `auction_start_date`,
    DROP COLUMN `departure_date`,
    DROP COLUMN `eta_to_ph`;
