/*
  Warnings:

  - Made the column `remarks` on table `expenses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `expenses` MODIFY `remarks` VARCHAR(191) NOT NULL;
