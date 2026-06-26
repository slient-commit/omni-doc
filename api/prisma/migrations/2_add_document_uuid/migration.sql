-- AlterTable: add uuid to documents
ALTER TABLE `documents` ADD COLUMN `uuid` VARCHAR(36) NOT NULL DEFAULT (UUID());

-- CreateIndex
CREATE UNIQUE INDEX `documents_uuid_key` ON `documents`(`uuid`);
