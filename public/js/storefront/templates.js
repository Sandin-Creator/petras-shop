import { PLACEHOLDER } from "./constants.js";
import { euro, hasSale, salePercent, computeBadge } from "./utils.js";

export function priceBlockHTML(p) {
  if (!hasSale(p)) return `<p class="price">${euro(p.price)}</p>`;
  const percent = salePercent(p);
  return `
    <p class="price">
      <span style="text-decoration:line-through; opacity:0.6; margin-right:6px;">${euro(p.oldPrice)}</span>
      <strong style="color:#e6004c">${euro(p.price)}</strong>
      <span style="background:#e6004c;color:#fff;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px;">
        SALE −${percent}%
      </span>
    </p>
  `;
}

export function productCard(p) {
  const imgSrc = (p.imageUrl && p.imageUrl.trim()) ? p.imageUrl : PLACEHOLDER;
  const badge = computeBadge(p);
  const badgeAttr = badge ? ` data-badge="${badge}"` : "";
  const slug = encodeURIComponent(p.slug);

  // Build category translation key, e.g. "clothes" -> "catClothes"
  const catKey = p.category
    ? "cat" + p.category.charAt(0).toUpperCase() + p.category.slice(1)
    : "";

  return `
    <article class="card"${badgeAttr}>
      <img src="${imgSrc}" alt="${p.name}" loading="lazy"
           onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
      <h4>${p.name}</h4>
      ${catKey ? `<p class="category" data-i18n="${catKey}">${p.category}</p>` : ""}
      ${priceBlockHTML(p)}
      <div class="actions">
        <a class="btn" href="/product.html?slug=${slug}" data-i18n="view">View</a>
        <button class="btn" data-quick data-slug="${slug}" data-i18n="quickView">Quick view</button>
      </div>
    </article>
  `;
}
