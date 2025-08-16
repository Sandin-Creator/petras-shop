// server/utils/listQuery.js
const { CATEGORIES } = require("../constants");

function eurosToCents(v) {
  if (v === undefined || String(v).trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

function buildListQuery(query, isAdmin) {
  const { q = "", category, min, max, sort = "new", page = "1", hidden } = query;

  const take = 24;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const skip = (p - 1) * take;

  const where = { AND: [] };
  if (!isAdmin) where.AND.push({ hidden: false });
  if (q) where.AND.push({ name: { contains: String(q), mode: "insensitive" } });
  if (category && CATEGORIES.includes(category)) where.AND.push({ category });

  const minC = eurosToCents(min);
  const maxC = eurosToCents(max);
  if (minC !== undefined) where.AND.push({ price: { gte: minC } });
  if (maxC !== undefined) where.AND.push({ price: { lte: maxC } });

  if (isAdmin && typeof hidden !== "undefined") {
    where.AND.push({ hidden: String(hidden) === "true" });
  }

  let orderBy = [{ createdAt: "desc" }];
  if (sort === "price-asc") orderBy = [{ price: "asc" }];
  else if (sort === "price-desc") orderBy = [{ price: "desc" }];
  else if (sort === "name-asc") orderBy = [{ name: "asc" }];

  return { where, orderBy, skip, take, page: p };
}

module.exports = { buildListQuery };
