// prisma/seed.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const prisma = require("../server/lib/prisma");

// Allowed values
const ROLES = ["ADMIN", "STAFF"];
const CATEGORIES = ["clothes", "shoes", "accessories", "electronics"];

function findDbJson() {
  const candidates = [
    path.join(process.cwd(), "server", "db", "db.json"),
    path.join(process.cwd(), "db.json")
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

(async () => {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@shop.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  // Ensure admin user exists
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: "ADMIN" },
    create: { email: ADMIN_EMAIL, passwordHash, role: "ADMIN" }
  });

  // Import products from legacy db.json if present
  const dbPath = findDbJson();
  if (dbPath) {
    const raw = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const products = Array.isArray(raw.products) ? raw.products : [];

    for (const p of products) {
      const createdAt =
        typeof p.createdAt === "number" ? new Date(p.createdAt) :
        p.createdAt ? new Date(p.createdAt) : new Date();

      // Enforce category validity
      const category = CATEGORIES.includes(p.category)
        ? p.category
        : "clothes";

      await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          price: Number(p.price) || 0,
          oldPrice: p.oldPrice !== undefined ? Number(p.oldPrice) : null,
          category,
          imageUrl: p.imageUrl || null,
          stock: Number(p.stock) || 0,
          createdAt
        },
        create: {
          slug: p.slug,
          name: p.name,
          price: Number(p.price) || 0,
          oldPrice: p.oldPrice !== undefined ? Number(p.oldPrice) : null,
          category,
          imageUrl: p.imageUrl || null,
          stock: Number(p.stock) || 0,
          createdAt
        }
      });
    }
  }

  console.log("Seed complete.");
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
