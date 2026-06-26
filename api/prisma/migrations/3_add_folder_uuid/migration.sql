ALTER TABLE `folders` ADD COLUMN `uuid` VARCHAR(36) NOT NULL DEFAULT (UUID());
CREATE UNIQUE INDEX `folders_uuid_key` ON `folders`(`uuid`);
