-- CreateTable
CREATE TABLE `EligibilityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NOT NULL,
    `templateKey` VARCHAR(191) NOT NULL DEFAULT 'default',
    `metadata` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `EligibilityEvent_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `config` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Template_key_isActive_idx`(`key`, `isActive`),
    UNIQUE INDEX `Template_key_version_key`(`key`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `id` VARCHAR(191) NOT NULL,
    `verificationCode` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `recipientName` VARCHAR(191) NOT NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `certificateTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `templateId` VARCHAR(191) NOT NULL,
    `templateVersion` INTEGER NOT NULL,
    `pdfPath` VARCHAR(191) NOT NULL,
    `sha256` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ISSUED',
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `lastEmailedAt` DATETIME(3) NULL,
    `emailSendCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Certificate_verificationCode_key`(`verificationCode`),
    INDEX `Certificate_verificationCode_idx`(`verificationCode`),
    INDEX `Certificate_recipientEmail_idx`(`recipientEmail`),
    INDEX `Certificate_eventType_status_issuedAt_idx`(`eventType`, `status`, `issuedAt`),
    UNIQUE INDEX `Certificate_eventId_recipientId_key`(`eventId`, `recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

