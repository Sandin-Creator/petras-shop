import { CATEGORIES } from "../constants";

export function eurosToCents(v: string | number | undefined): number | undefined {
  if (v === undefined || String(v).trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

export function buildListQuery(query: any, isAdmin: boolean) {
  const { q = "", category, min, max, sort = "new", page = "1", hidden, sale, includeHidden } = query;

  const take = 24;
  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const skip = (p - 1) * take;

  const where: any = { AND: [] };

  // Default to showing only visible products.
  // Only Admins can bypass this if they explicitly ask via 'includeHidden'.
  const showAll = isAdmin && includeHidden === 'true';

  if (!showAll) {
    where.AND.push({ hidden: false });
  } else {
    // If showing all (admin mode), respect specific hidden filter if present
    if (typeof hidden !== "undefined") {
      where.AND.push({ hidden: String(hidden) === "true" });
    }
  }

  if (q) where.AND.push({ name: { contains: String(q), mode: "insensitive" } });

  // Cast CATEGORIES to readonly string array for includes check
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    where.AND.push({ category });
  }

  const minC = eurosToCents(min);
  const maxC = eurosToCents(max);
  if (minC !== undefined) where.AND.push({ price: { gte: minC } });
  if (maxC !== undefined) where.AND.push({ price: { lte: maxC } });

  if (sale === "true") {
    where.AND.push({ oldPrice: { not: null } });
  }

  let orderBy: any[] = [{ createdAt: "desc" }];
  if (sort === "price-asc") orderBy = [{ price: "asc" }];
  else if (sort === "price-desc") orderBy = [{ price: "desc" }];
  else if (sort === "name-asc") orderBy = [{ name: "asc" }];

  return { where, orderBy, skip, take, page: p };
}
