import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_TEMPLATE_CONFIG } from "../src/lib/template";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function seedDefaultTemplate() {
  const existing = await prisma.template.findFirst({ where: { key: "default" } });
  if (existing) {
    console.log("Default template already exists, skipping seed.");
    return;
  }

  await prisma.template.create({
    data: {
      key: "default",
      version: 1,
      name: "Default certificate",
      isActive: true,
      config: JSON.stringify(DEFAULT_TEMPLATE_CONFIG),
    },
  });
  console.log("Seeded default template.");
}

async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists, skipping seed.`);
    return;
  }

  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");

  await prisma.user.create({
    data: { email, passwordHash: hashPassword(password) },
  });
  console.log(`Seeded admin user: ${email}`);
  if (generated) {
    console.log(`Generated password (save it — it will not be shown again): ${password}`);
  }
}

async function main() {
  await seedDefaultTemplate();
  await seedAdminUser();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
