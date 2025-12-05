/*
  Warnings:

  - Made the column `branch_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `branch_id` VARCHAR(191) NOT NULL;
