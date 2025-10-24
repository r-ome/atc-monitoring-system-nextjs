/*
  Warnings:

  - You are about to drop the `configurations` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `bidders` ADD COLUMN `payment_term` INTEGER NOT NULL DEFAULT 7;

-- DropTable
DROP TABLE `configurations`;
