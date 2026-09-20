-- AlterTable
ALTER TABLE `Certificate` ADD COLUMN `ownerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `EligibilityEvent` ADD COLUMN `ownerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Certificate_ownerId_idx` ON `Certificate`(`ownerId`);

-- AddForeignKey
ALTER TABLE `EligibilityEvent` ADD CONSTRAINT `EligibilityEvent_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
