import { PLACEHOLDER } from "./constants.js";

export const $ = (s) => document.querySelector(s);

export function euro(cents = 0) {
  return new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" })
    .format((cents || 0) / 100);
}

export function normalizeEuroInput(v) {
  return String(v ?? "").replace(",", ".").trim();
}

export function hasSale(p) {
  return Number.isFinite(p?.oldPrice) && Number.isFinite(p?.price) && p.oldPrice > p.price;
}
export function salePercent(p) {
  return hasSale(p) ? Math.round(100 - (p.price / p.oldPrice) * 100) : 0;
}

export function isNew(createdAt) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  return !isNaN(d) && (Date.now() - d.getTime()) / 86400000 <= 14;
}

export function computeBadge(p) {
  if (hasSale(p)) return `SALE -${salePercent(p)}%`;
  if (typeof p.stock === "number") {
    if (p.stock === 0) return "OUT";
    if (p.stock <= 3) return "LOW STOCK";
  }
  if (isNew(p.createdAt)) return "NEW";
  return "";
}

// keep quickview.js working (relies on globals)
export function exposeGlobals() {
  window.PLACEHOLDER = PLACEHOLDER;
  window.euro = euro;
  window.computeBadge = computeBadge;
}
