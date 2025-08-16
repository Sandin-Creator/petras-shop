// public/js/product.js
const details = document.getElementById("productDetails");
const similarGrid = document.getElementById("similarGrid");

const PLACEHOLDER = "/images/placeholder.png"; // default fallback image

/* ---------- format helpers ---------- */
function euro(cents = 0) {
  return new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" })
    .format((cents || 0) / 100);
}

function hasSale(p) {
  return typeof p.oldPrice === "number" && typeof p.price === "number" && p.oldPrice > p.price;
}
function salePercent(p) {
  if (!hasSale(p)) return 0;
  return Math.round(100 - (p.price / p.oldPrice) * 100);
}

/* ---------- badges (same as storefront) ---------- */
function isNew(createdAt) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  return !isNaN(d) && (Date.now() - d.getTime()) / 86400000 <= 14;
}
function computeBadge(p) {
  if (typeof p.stock === "number") {
    if (p.stock === 0) return "OUT";
    if (p.stock <= 3) return "LOW STOCK";
  }
  if (isNew(p.createdAt)) return "NEW";
  return "";
}

/* ---------- shared price HTML ---------- */
function priceHTML(p, { large = false } = {}) {
  const baseStyle = large
    ? "font-size:22px; line-height:1.25; display:flex; align-items:center; gap:10px; flex-wrap:wrap;"
    : "font-size:14px;";
  if (!hasSale(p)) {
    return `<span style="${baseStyle}">${euro(p.price)}</span>`;
  }
  const percent = salePercent(p);
  return `
    <div style="${baseStyle}">
      <span style="text-decoration:line-through; opacity:0.6">${euro(p.oldPrice)}</span>
      <span style="color:#e6004c; font-weight:700">${euro(p.price)}</span>
      <span style="background:#e6004c;color:#fff;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:700">
        SALE −${percent}%
      </span>
    </div>
  `;
}

function savingsHTML(p) {
  if (!hasSale(p)) return "";
  const saved = p.oldPrice - p.price;
  const percent = salePercent(p);
  return `<div class="price" style="margin-top:6px">You save <strong>${euro(saved)}</strong> (${percent}%)</div>`;
}

/* ---------- slug ---------- */
const params = new URLSearchParams(location.search);
const slug = params.get("slug");

if (!slug) {
  details.innerHTML = `<p>Invalid product link.</p>`;
} else {
  loadProduct(slug);
}

/* ---------- product loader ---------- */
async function loadProduct(slug) {
  try {
    details.innerHTML = `<p class="price">Loading...</p>`;
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);

    if (!res.ok) {
      details.innerHTML = `<p>Product not found.</p>`;
      return;
    }

    const product = await res.json();
    const imgSrc =
      product.imageUrl && product.imageUrl.trim() ? product.imageUrl : PLACEHOLDER;

    // Set stock/new badge on the card
    const badge = computeBadge(product);
    if (badge) details.setAttribute("data-badge", badge);
    else details.removeAttribute("data-badge");

    // Render details (with sale handling)
    details.innerHTML = `
      <img src="${imgSrc}" alt="${product.name}"
           style="width:100%;max-height:300px;object-fit:cover;border-radius:10px;"
           onerror="this.onerror=null;this.src='${PLACEHOLDER}'">

      <h2 style="margin-top:12px; display:flex; align-items:center; gap:8px">
        ${product.name}
        ${hasSale(product) ? `
          <span style="background:#e6004c;color:#fff;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700">
            SALE −${salePercent(product)}%
          </span>` : ``}
      </h2>

      ${priceHTML(product, { large: true })}
      ${savingsHTML(product)}

      <p style="margin-top:10px">Category: ${product.category || "—"}</p>
      <p>Stock: ${typeof product.stock === "number" ? product.stock : "—"}</p>
      <p>Added: ${product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}</p>
    `;

    // Load similar products
    loadSimilar(product.category || "", slug);
  } catch (err) {
    console.error(err);
    details.innerHTML = `<p>Error loading product.</p>`;
  }
}

/* ---------- similar products ---------- */
async function loadSimilar(category, excludeSlug) {
  try {
    similarGrid.innerHTML = `<p class="price">Loading...</p>`;
    const res = await fetch(
      `/api/products?category=${encodeURIComponent(category)}&page=1`
    );
    if (!res.ok) {
      similarGrid.innerHTML = `<p>Error loading similar products.</p>`;
      return;
    }

    const { items = [] } = await res.json();
    const filtered = items.filter((p) => p.slug !== excludeSlug).slice(0, 4);

    if (filtered.length === 0) {
      similarGrid.innerHTML = `<p>No similar products found.</p>`;
      return;
    }

    similarGrid.innerHTML = filtered
      .map((p) => {
        const imgSrc = p.imageUrl && p.imageUrl.trim() ? p.imageUrl : PLACEHOLDER;
        const badge = computeBadge(p);
        const badgeAttr = badge ? ` data-badge="${badge}"` : "";
        const priceBlock = hasSale(p)
          ? `
            <div class="price">
              <span style="text-decoration:line-through; opacity:0.6; margin-right:6px;">${euro(p.oldPrice)}</span>
              <strong style="color:#e6004c">${euro(p.price)}</strong>
            </div>`
          : `<p class="price">${euro(p.price)}</p>`;

        return `
          <article class="card"${badgeAttr}>
            <img src="${imgSrc}" alt="${p.name}"
                 onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
            <h4>${p.name}</h4>
            ${priceBlock}
            ${hasSale(p) ? `<div class="price" style="font-size:12px; margin-top:2px">−${salePercent(p)}%</div>` : ``}
            <a class="btn" href="/product.html?slug=${encodeURIComponent(p.slug)}">View</a>
          </article>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    similarGrid.innerHTML = `<p>Error loading similar products.</p>`;
  }
}
