-- DropForeignKey
ALTER TABLE `Certificate` DROP FOREIGN KEY `Certificate_templateId_fkey`;

-- DropIndex
DROP INDEX `Certificate_templateId_fkey` ON `Certificate`;

-- AlterTable
ALTER TABLE `Certificate` MODIFY `templateId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
