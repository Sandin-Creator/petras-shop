import { PLACEHOLDER } from "./constants.js";

export const euro = (c) =>
  new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" })
    .format(Number(c || 0) / 100);

// Accept "4,99" and "4.99"
export function toCents(val) {
  const n = Number(String(val ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function isNew(createdAt) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  return !isNaN(d) && (Date.now() - d.getTime()) / 86400000 <= 14;
}

export function computeBadge(p) {
  if (typeof p.stock === "number") {
    if (p.stock === 0) return "OUT";
    if (p.stock <= 3) return "LOW STOCK";
  }
  if (isNew(p.createdAt)) return "NEW";
  return "";
}

export function badgeHTML(label) {
  if (!label) return "";
  const bg =
    label === "OUT" ? "background:#553845;color:#fff;"
    : label === "LOW STOCK" ? "background:#ffd1e1;color:#553845;border:1px solid rgba(255,143,179,.45);"
    : "background:#ff4f87;color:#fff;";
  return `<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;${bg}">${label}</span>`;
}

export function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.bottom = "14px";
  t.style.right = "14px";
  t.style.background = "#191a1c";
  t.style.border = "1px solid #2a2b2f";
  t.style.padding = "8px 10px";
  t.style.borderRadius = "10px";
  t.style.opacity = "0.95";
  t.style.zIndex = "9999";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

export function renderPreview(previewEl, url) {
  const imgSrc = url && url.trim() ? url : PLACEHOLDER;
  previewEl.innerHTML = `<img src="${imgSrc}" style="max-width:100%;max-height:140px;border-radius:8px;object-fit:cover"
    onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
}
