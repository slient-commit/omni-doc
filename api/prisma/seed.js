const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Documents
  { action: "create", subject: "document" },
  { action: "read", subject: "document" },
  { action: "update", subject: "document" },
  { action: "delete", subject: "document" },

  // Folders
  { action: "create", subject: "folder" },
  { action: "read", subject: "folder" },
  { action: "update", subject: "folder" },
  { action: "delete", subject: "folder" },

  // Categories
  { action: "create", subject: "category" },
  { action: "read", subject: "category" },
  { action: "update", subject: "category" },
  { action: "delete", subject: "category" },

  // Users
  { action: "create", subject: "user" },
  { action: "read", subject: "user" },
  { action: "update", subject: "user" },
  { action: "delete", subject: "user" },

  // Roles
  { action: "create", subject: "role" },
  { action: "read", subject: "role" },
  { action: "update", subject: "role" },
  { action: "delete", subject: "role" },

  // Organization settings
  { action: "manage", subject: "organization" },

  // Sharing
  { action: "create", subject: "share_link" },
  { action: "read", subject: "share_link" },
  { action: "delete", subject: "share_link" },

  // Invites
  { action: "create", subject: "invite" },
  { action: "read", subject: "invite" },
  { action: "delete", subject: "invite" },
];

async function main() {
  console.log("Seeding permissions...");

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action_subject: { action: perm.action, subject: perm.subject } },
      update: {},
      create: perm,
    });
  }

  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
