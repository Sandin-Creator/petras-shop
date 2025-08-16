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

  return `
    <article class="card"${badgeAttr}>
      <img src="${imgSrc}" alt="${p.name}" loading="lazy"
           onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
      <h4>${p.name}</h4>
      ${priceBlockHTML(p)}
      <div class="actions">
        <a class="btn" href="/product.html?slug=${slug}">View</a>
        <button class="btn" data-quick data-slug="${slug}">Quick view</button>
      </div>
    </article>
  `;
}
