import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { CATEGORIES } from '../src/constants';

dotenv.config();

function findDbJson() {
  const candidates = [
    path.join(process.cwd(), "db", "db.json"), // server/db/db.json
    path.join(process.cwd(), "..", "db.json"), // ../db.json
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

function toInt(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

(async () => {
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@shop.com").trim().toLowerCase();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  // Ensure admin user exists
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: "ADMIN" },
    create: { email: ADMIN_EMAIL, passwordHash, role: "ADMIN" },
  });
  console.log(`✅ Admin ensured: ${ADMIN_EMAIL}`);

  // Optional: import legacy products from db.json if present
  const dbPath = findDbJson();
  if (dbPath) {
    const raw = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const products = Array.isArray(raw.products) ? raw.products : [];
    let created = 0, updated = 0;

    for (const p of products) {
      const createdAt =
        typeof p.createdAt === "number" ? new Date(p.createdAt) :
          p.createdAt ? new Date(p.createdAt) : new Date();

      // Validate/normalize
      const category = (CATEGORIES as any).includes(p.category) ? p.category : null;
      const price = toInt(p.price, 0);
      const oldPrice = p.oldPrice !== undefined && p.oldPrice !== null ? toInt(p.oldPrice, 0) : null;
      const stock = toInt(p.stock, 0);
      const imageUrl = p.imageUrl || null;

      const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
      if (exists) {
        await prisma.product.update({
          where: { slug: p.slug },
          data: { name: p.name, price, oldPrice, category, imageUrl, stock, hidden: !!p.hidden, createdAt },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: { slug: p.slug, name: p.name, price, oldPrice, category, imageUrl, stock, hidden: !!p.hidden, createdAt },
        });
        created++;
      }
    }
    console.log(`📦 Products imported from db.json → created: ${created}, updated: ${updated}`);
  } else {
    console.log("ℹ️ No db.json found — skipping product import.");
  }

  await prisma.$disconnect();
  console.log("✅ Seed complete.");
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
