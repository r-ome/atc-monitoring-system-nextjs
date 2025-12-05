/*
  Warnings:

  - You are about to drop the column `registered_at` on the `bidders` table. All the data in the column will be lost.
  - Made the column `branch_id` on table `bidders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `bidders` DROP COLUMN `registered_at`,
    MODIFY `branch_id` VARCHAR(191) NOT NULL;
