-- DropForeignKey
ALTER TABLE `certificate` DROP FOREIGN KEY `Certificate_templateId_fkey`;

-- DropIndex
DROP INDEX `Certificate_templateId_fkey` ON `certificate`;

-- AlterTable
ALTER TABLE `certificate` MODIFY `templateId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
