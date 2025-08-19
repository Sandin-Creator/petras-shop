import { PLACEHOLDER, CATEGORIES } from "./constants.js";
import { euro, computeBadge, badgeHTML } from "./utils.js";

export function rowView(p) {
  const imgSrc = p.imageUrl && p.imageUrl.trim() ? p.imageUrl : PLACEHOLDER;
  const badge = computeBadge(p);

  let saleRibbon = "";
  if (p.oldPrice && p.oldPrice > p.price) {
    const percent = Math.round(100 - (p.price / p.oldPrice) * 100);
    saleRibbon = `<span style="background:#e6004c;color:#fff;font-size:11px;font-weight:700;padding:2px 6px;margin-left:6px;border-radius:4px;">SALE -${percent}%</span>`;
  }

  const hiddenTag = p.hidden
    ? `<span style="margin-left:8px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#553845;color:#fff">HIDDEN</span>` : "";
  const hideLabel = p.hidden ? "Unhide" : "Hide";

  let priceHTML = euro(p.price);
  if (p.oldPrice && p.oldPrice > p.price) {
    priceHTML = `
      <span style="text-decoration:line-through; opacity:0.6; margin-right:6px;">${euro(p.oldPrice)}</span>
      <span style="color:#e6004c; font-weight:700;">${euro(p.price)}</span>
    `;
  }

  return `
    <div class="row" data-id="${p.id}" data-hidden="${p.hidden ? "1" : "0"}">
      <div style="display:flex; gap:8px; align-items:center">
        <img src="${imgSrc}" alt="${p.name}" width="40" height="40"
             style="border-radius:6px;object-fit:cover"
             onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
        <div>
          <div>${p.id}. ${p.name} ${badgeHTML(badge)} ${hiddenTag} ${saleRibbon}</div>
          <div class="price" style="font-size:12px">
            <strong>${p.category || "—"}</strong> — ${priceHTML} — stock ${typeof p.stock === "number" ? p.stock : "—"}
          </div>
        </div>
      </div>
      <div>
        <button class="btn" data-edit="${p.id}">Edit</button>
        <button class="btn" data-action="stock">Stock − / +</button>
        <button class="btn" data-action="hide">${hideLabel}</button>
        <button class="btn btn-accent" data-del="${p.id}">Delete</button>
      </div>
    </div>`;
}

export function rowEditor(p) {
  const onSale = p.oldPrice && p.oldPrice > p.price;
  const regularC = onSale ? p.oldPrice : p.price;
  const saleC = onSale ? p.price : null;

  const catOpts = [
    { value: "", label: "— No category —" },
    ...CATEGORIES.slice(1).map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
  ].map(c => `<option value="${c.value}" ${(p.category ?? "") === c.value ? "selected" : ""}>${c.label}</option>`).join("");

  const imgSrc = p.imageUrl && p.imageUrl.trim() ? p.imageUrl : PLACEHOLDER;
  const badge = computeBadge(p);

  let discountHelper = "";
  if (saleC !== null && regularC > saleC) {
    const percent = Math.round(100 - (saleC / regularC) * 100);
    discountHelper = `<span style="font-size:12px; color:#e6004c; font-weight:600; margin-left:6px">(−${percent}%)</span>`;
  }

  return `
    <div class="row edit" data-id="${p.id}">
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <input name="name" value="${p.name}" placeholder="Name" />
        <input name="slug" value="${p.slug}" placeholder="Slug" />

        <input name="priceEuro" type="number" step="0.01"
               value="${(regularC / 100).toFixed(2)}" placeholder="Regular Price (€)" />

        <div style="display:flex; align-items:center; gap:6px;">
          <input name="oldPriceEuro" type="number" step="0.01"
                 value="${saleC !== null ? (saleC / 100).toFixed(2) : ""}"
                 placeholder="Sale Price (€)" />
          ${discountHelper}
        </div>

        <select name="category">${catOpts}</select>

        <!-- ⤵ add id so main.js can set after upload -->
        <input id="imgUrl-${p.id}" name="imageUrl" value="${p.imageUrl || ""}" placeholder="Image URL" />

        <input name="stock" type="number" value="${p.stock || 0}" placeholder="Stock" />
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap">
        <!-- preview with stable id -->
        <img id="imgPreview-${p.id}" src="${imgSrc}" alt="${p.name}"
             style="max-width:120px;border-radius:6px;object-fit:cover"
             onerror="this.onerror=null;this.src='${PLACEHOLDER}'">

        <!-- inline upload controls -->
        <div class="upload-inline" style="display:flex;align-items:center;gap:8px">
          <input type="file" id="editFile-${p.id}" accept="image/*" />
          <!-- background removal toggle for Edit -->
          <label style="display:inline-flex;align-items:center;gap:6px">
            <input type="checkbox" id="editBg-${p.id}" checked>
            <span>Remove background</span>
          </label>
          <button class="btn" id="editUpload-${p.id}">Upload</button>
          <!-- NEW: choose an existing file from /uploads -->
          <button class="btn" id="editChoose-${p.id}">Choose existing</button>
          <small style="opacity:.7">Uploads save to /uploads and set Image URL</small>
        </div>

        ${badgeHTML(badge)}
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-accent" data-save="${p.id}">Save</button>
        <button class="btn" data-cancel="${p.id}">Cancel</button>
      </div>
    </div>`;
}
