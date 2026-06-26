-- AlterTable: add deletedAt to documents
ALTER TABLE `documents` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable: add deletedAt to folders
ALTER TABLE `folders` ADD COLUMN `deletedAt` DATETIME(3) NULL;
