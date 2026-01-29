/*
  Warnings:

  - You are about to drop the column `balance` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `petty_cash` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `expenses` DROP COLUMN `balance`;

-- AlterTable
ALTER TABLE `petty_cash` DROP COLUMN `balance`,
    ADD COLUMN `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0;
