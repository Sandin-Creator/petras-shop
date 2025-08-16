// server/controllers/products.js
const prisma = require("../lib/prisma");
const { CATEGORIES } = require("../constants");
const { buildListQuery } = require("../utils/listQuery");

/* ---------- helpers ---------- */
const isAdmin = (req) => req.session?.user?.role === "ADMIN";
const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const validCategory = (c) => !c || CATEGORIES.includes(c);

/** Only keep compare-at if it's a valid number and strictly greater than price.
 *  - oldPrice === undefined  -> don't change (for PUT)
 *  - oldPrice === null/""    -> clear it
 *  - else                    -> keep only if > price, otherwise null
 */
const safeCompareAt = (priceCents, oldMaybe) => {
  if (oldMaybe === undefined) return undefined; // no change
  if (oldMaybe === null || oldMaybe === "") return null; // explicit clear
  const old = Number(oldMaybe);
  return Number.isFinite(old) && old > toNumber(priceCents, 0) ? old : null;
};

const handlePrismaError = (res, e, fallback) => {
  if (e?.code === "P2002") return res.status(400).json({ error: "Slug already exists" });
  if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
  console.error(e);
  return res.status(500).json({ error: fallback });
};

/* ---------- controllers ---------- */

// GET /api/products
async function list(req, res) {
  const admin = isAdmin(req);
  const { where, orderBy, skip, take, page } = buildListQuery(req.query, admin);

  try {
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, total, page });
  } catch (e) {
    handlePrismaError(res, e, "List failed");
  }
}

// GET /api/products/:slug
async function getBySlug(req, res) {
  try {
    const p = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!p) return res.status(404).json({ error: "Not found" });
    if (p.hidden && !isAdmin(req)) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (e) {
    handlePrismaError(res, e, "Fetch failed");
  }
}

// POST /api/products
async function create(req, res) {
  const body = { ...req.body };
  if (!body.name || !body.slug) return res.status(400).json({ error: "Name and slug are required" });
  if (!validCategory(body.category)) return res.status(400).json({ error: "Invalid category" });

  const price = toNumber(body.price, 0);                 // cents
  const oldPrice = safeCompareAt(price, body.oldPrice);  // guarded

  try {
    const created = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        price,
        oldPrice,
        category: body.category || null,
        imageUrl: body.imageUrl || null,
        stock: toNumber(body.stock, 0),
        hidden: !!body.hidden,
      },
    });
    res.json(created);
  } catch (e) {
    handlePrismaError(res, e, "Create failed");
  }
}

// PUT /api/products/:id
async function update(req, res) {
  const id = toNumber(req.params.id, NaN);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const body = { ...req.body };
  if (!validCategory(body.category)) return res.status(400).json({ error: "Invalid category" });

  try {
    const current = await prisma.product.findUnique({ where: { id }, select: { price: true } });
    if (!current) return res.status(404).json({ error: "Not found" });

    const nextPrice = body.price !== undefined ? toNumber(body.price, 0) : current.price;
    const nextOld = safeCompareAt(nextPrice, body.oldPrice);

    const next = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        price: body.price !== undefined ? nextPrice : undefined,
        oldPrice: nextOld, // undefined = no change; null = clear; number = set
        category: body.category || null,
        imageUrl: body.imageUrl ?? undefined,
        stock: body.stock !== undefined ? toNumber(body.stock, 0) : undefined,
        hidden: body.hidden !== undefined ? !!body.hidden : undefined,
      },
    });
    res.json(next);
  } catch (e) {
    handlePrismaError(res, e, "Update failed");
  }
}

// DELETE /api/products/:id
async function remove(req, res) {
  const id = toNumber(req.params.id, NaN);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    handlePrismaError(res, e, "Delete failed");
  }
}

// PATCH /api/products/:id/stock
async function patchStock(req, res) {
  const id = toNumber(req.params.id, NaN);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const delta = toNumber(req.body?.delta, 0);
  try {
    const next = await prisma.product.update({
      where: { id },
      data: { stock: { increment: delta } },
    });
    res.json(next);
  } catch (e) {
    handlePrismaError(res, e, "Stock update failed");
  }
}

// PATCH /api/products/:id/visibility
async function patchVisibility(req, res) {
  const id = toNumber(req.params.id, NaN);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const hidden = !!req.body?.hidden;
  try {
    const next = await prisma.product.update({
      where: { id },
      data: { hidden },
    });
    res.json(next);
  } catch (e) {
    handlePrismaError(res, e, "Visibility toggle failed");
  }
}

module.exports = {
  list,
  getBySlug,
  create,
  update,
  remove,
  patchStock,
  patchVisibility,
};
