-- Add uuid column without unique constraint first
ALTER TABLE `folders` ADD COLUMN `uuid` VARCHAR(36) NOT NULL DEFAULT (UUID());

-- Generate unique UUIDs for any existing rows (DEFAULT UUID() may give same value in ALTER TABLE)
UPDATE `folders` SET `uuid` = (SELECT UUID()) WHERE `uuid` IS NOT NULL;

-- Now add the unique index
CREATE UNIQUE INDEX `folders_uuid_key` ON `folders`(`uuid`);
