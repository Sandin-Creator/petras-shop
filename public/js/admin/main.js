import "./guard.js"; // auth check
import { api } from "./api.js";
import { CATEGORIES, PLACEHOLDER } from "./constants.js";
import { euro, toCents, slugify, computeBadge, badgeHTML, toast, renderPreview } from "./utils.js";
import { rowView, rowEditor } from "./templates.js";

/* ---------- DOM ---------- */
const list = document.getElementById("adminList");
const logoutBtn = document.getElementById("logout");
const createForm = document.getElementById("createForm");

const newName = document.getElementById("newName");
const newSlug = document.getElementById("newSlug");
const newPrice = document.getElementById("newPrice");       // Regular price (€)
const newOldPrice = document.getElementById("newOldPrice"); // Sale price (€) - discounted
const newCategory = document.getElementById("newCategory");
const newStock = document.getElementById("newStock");

const imageFile = document.getElementById("imageFile");
const uploadBtn = document.getElementById("uploadBtn");
const imageUrlInput = document.getElementById("imageUrl");
const preview = document.getElementById("preview");

const adminSearch = document.getElementById("adminSearch");
const adminSort = document.getElementById("adminSort");

/* ---------- Auth ---------- */
logoutBtn.onclick = async () => {
  try { await api.logout(); } catch {}
  location.href = "/";
};

/* ---------- Slug auto-fill ---------- */
let slugDirty = false;
newName?.addEventListener("input", () => { if (!slugDirty) newSlug.value = slugify(newName.value); });
newSlug?.addEventListener("input", () => { slugDirty = true; });

/* ---------- Preview / Upload ---------- */
renderPreview(preview, imageUrlInput?.value || "");
imageUrlInput?.addEventListener("input", () => renderPreview(preview, imageUrlInput.value));

if (uploadBtn) {
  uploadBtn.onclick = async () => {
    if (!imageFile.files[0]) return alert("Choose an image first.");
    try {
      const { url } = await api.uploadImage(imageFile.files[0]);
      imageUrlInput.value = url;
      renderPreview(preview, url);
    } catch (e) {
      alert(e.message || "Upload failed");
    }
  };
}

/* ---------- State ---------- */
let cache = [];

function applyAdminFilters(items) {
  let out = items.slice();
  const q = (adminSearch?.value || "").trim().toLowerCase();
  if (q) out = out.filter((p) => (p.name || "").toLowerCase().includes(q));

  const sort = adminSort?.value || "new";
  if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (sort === "name-asc") out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  else out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return out;
}

async function refresh() {
  const { items } = await api.listProducts();
  cache = items || [];
  renderList();
}

function renderList() {
  const items = applyAdminFilters(cache);
  list.innerHTML = items.map(rowView).join("");

  // Delete
  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this product?")) return;
      try {
        await api.deleteProduct(btn.dataset.del);
        toast("Deleted");
        refresh();
      } catch (e) {
        alert(e.message || "Delete failed");
      }
    };
  });

  // Edit
  list.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () => openEditor(btn.dataset.edit);
  });

  // Stock adjust
  list.querySelectorAll("[data-action='stock']").forEach((btn) => {
    btn.onclick = async () => {
      const row = btn.closest(".row");
      const id = row.dataset.id;
      const deltaStr = prompt("Adjust stock by (e.g. +1 or -1):", "1");
      if (deltaStr === null) return;
      const delta = Number(deltaStr);
      if (!Number.isFinite(delta) || delta === 0) return alert("Enter a non-zero number.");

      try {
        await api.patchStock(id, delta);
        toast("Stock updated");
        refresh();
      } catch (e) {
        alert(e.message || "Stock update failed");
      }
    };
  });

  // Hide / Unhide
  list.querySelectorAll("[data-action='hide']").forEach((btn) => {
    btn.onclick = async () => {
      const row = btn.closest(".row");
      const id = row.dataset.id;
      const isHidden = row.dataset.hidden === "1";
      const nextHidden = !isHidden;

      try {
        await api.patchVisibility(id, nextHidden);
        toast(nextHidden ? "Hidden" : "Unhidden");
        refresh();
      } catch (e) {
        alert(e.message || "Visibility toggle failed");
      }
    };
  });
}

function openEditor(id) {
  const p = cache.find((x) => String(x.id) === String(id));
  const row = list.querySelector(`.row[data-id="${id}"]`);
  row.outerHTML = rowEditor(p);

  const editor = list.querySelector(`.row.edit[data-id="${id}"]`);

  editor.querySelector("[data-cancel]").onclick = () => {
    editor.outerHTML = rowView(p);
    renderList(); // re-bind handlers
  };

  editor.querySelector("[data-save]").onclick = async () => {
    // Regular & Sale in edit form
    const regularC = toCents(editor.querySelector('[name="priceEuro"]').value);      // regular €
    const saleStr  = editor.querySelector('[name="oldPriceEuro"]').value.trim();     // sale €

    let priceC, oldC;
    if (saleStr) {
      const saleC = toCents(saleStr);
      if (saleC >= regularC) return alert("Sale price must be lower than the regular price.");
      priceC = saleC;     // charge discounted
      oldC   = regularC;  // compare-at is regular
    } else {
      priceC = regularC;  // no sale
      oldC   = null;
    }

    const rawCategory = editor.querySelector('[name="category"]').value;

    const payload = {
      name: editor.querySelector('[name="name"]').value,
      slug: editor.querySelector('[name="slug"]').value,
      price: priceC,
      oldPrice: oldC,
      category: rawCategory === "" ? null : rawCategory,
      imageUrl: editor.querySelector('[name="imageUrl"]').value.trim(),
      stock: Number(editor.querySelector('[name="stock"]').value || 0),
    };

    try {
      await api.updateProduct(id, payload);
      toast("Saved");
      refresh();
    } catch (e) {
      alert(e.message || "Update failed");
    }
  };
}

/* ---------- Create ---------- */
createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rawCategory = newCategory?.value ?? "";

  const regularC = toCents(newPrice.value);               // regular/original €
  const saleStr  = (newOldPrice?.value || "").trim();    // sale €/discounted

  let priceC, oldC;
  if (saleStr) {
    const saleC = toCents(saleStr);
    if (saleC >= regularC) return alert("Sale price must be lower than the regular price.");
    priceC = saleC;  // charge discounted
    oldC   = regularC; // compare-at is regular
  } else {
    priceC = regularC;
    oldC   = null;
  }

  const payload = {
    name: newName.value,
    slug: newSlug.value,
    price: priceC,
    oldPrice: oldC,
    category: rawCategory === "" ? null : rawCategory,
    imageUrl: imageUrlInput.value && imageUrlInput.value.trim() ? imageUrlInput.value.trim() : PLACEHOLDER,
    stock: Number(newStock.value || 0),
  };

  try {
    await api.createProduct(payload);
    createForm.reset();
    slugDirty = false;
    renderPreview(preview, ""); // reset preview
    toast("Created");
    refresh();
  } catch (err) {
    alert(err.message || "Create failed");
  }
});

/* ---------- Filters ---------- */
adminSearch?.addEventListener("input", renderList);
adminSort?.addEventListener("change", renderList);

/* ---------- Init ---------- */
refresh();
