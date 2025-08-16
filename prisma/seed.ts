// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@petras.shop";
  const plainPwd = process.env.ADMIN_PASSWORD || "changeme123";

  const hash = await bcrypt.hash(plainPwd, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hash,  // ✅ matches schema
      role: "ADMIN",       // or "STAFF" if you seed staff users
    },
  });

  console.log("Seeded admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
