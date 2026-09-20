/*
  Warnings:

  - Made the column `ownerId` on table `certificate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ownerId` on table `eligibilityevent` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Certificate` DROP FOREIGN KEY `Certificate_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `EligibilityEvent` DROP FOREIGN KEY `EligibilityEvent_ownerId_fkey`;

-- DropIndex
DROP INDEX `EligibilityEvent_ownerId_fkey` ON `EligibilityEvent`;

-- AlterTable
ALTER TABLE `Certificate` MODIFY `ownerId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `EligibilityEvent` MODIFY `ownerId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `EligibilityEvent` ADD CONSTRAINT `EligibilityEvent_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
