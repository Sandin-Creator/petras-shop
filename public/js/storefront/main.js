import { PLACEHOLDER } from "./constants.js";
import { $, euro, normalizeEuroInput, exposeGlobals } from "./utils.js";
import { productCard } from "./templates.js";
import { searchProducts } from "./api.js";
import { renderActiveFilters, clearAllFilters, updatePriceHints } from "./filters.js";

/* ---------- Globals for quickview compatibility ---------- */
exposeGlobals();

/* ---------- DOM ---------- */
const grid = $("#grid");
const resultsMeta = $("#results-meta");
const loadMoreBtn = $("#loadMore");
const densityToggle = $("#densityToggle");
const onlySaleEl = $("#onlySale");
const inStockEl = $("#inStock");

/* ---------- Pagination state ---------- */
let page = 1;
let loading = false;
let done = false;

/* ---------- Persist/restore filters ---------- */
function saveFiltersToStorage() {
  const ids = ["q","category","min","max","sort","onlySale","inStock"];
  const out = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    out[id] = el.type === "checkbox" ? el.checked : el.value;
  });
  localStorage.setItem("storefrontFilters", JSON.stringify(out));
}

(function restoreFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem("storefrontFilters") || "{}");
    for (const [id, val] of Object.entries(saved)) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = !!val;
      else el.value = String(val ?? "");
    }
  } catch {}
  // URL params override saved values
  const u = new URL(location.href);
  $("#q").value        = (u.searchParams.get("q")        ?? $("#q").value) || "";
  $("#category").value = (u.searchParams.get("category") ?? $("#category").value) || "";
  $("#min").value      = (u.searchParams.get("min")      ?? $("#min").value) || "";
  $("#max").value      = (u.searchParams.get("max")      ?? $("#max").value) || "";
  $("#sort").value     = (u.searchParams.get("sort")     ?? $("#sort").value) || "new";
})();

/* ---------- Helpers (sale / discount) ---------- */
function hasSale(p) {
  return Number.isFinite(p.oldPrice) && Number.isFinite(p.price) && p.oldPrice > p.price;
}
function discountPercent(p) {
  return hasSale(p) ? Math.round(100 - (p.price / p.oldPrice) * 100) : 0;
}
function applyClientOnlyFilters(items, opts) {
  let out = items.slice();
  if (opts.onlySale) out = out.filter(hasSale);
  if (opts.inStock)  out = out.filter(p => (Number(p.stock) || 0) > 0);
  if (opts.sort === "discount-desc") out.sort((a, b) => discountPercent(b) - discountPercent(a));
  return out;
}

/* ---------- Core loader ---------- */
async function load({ append = false } = {}) {
  if (loading || (append && done)) return;
  loading = true;

  const qVal    = $("#q").value || "";
  const catVal  = $("#category").value || "";
  const minVal  = normalizeEuroInput($("#min").value || "");
  const maxVal  = normalizeEuroInput($("#max").value || "");
  const sortVal = $("#sort").value || "new";

  // Server doesn't know about discount sort; ask for "new" then sort client-side
  const serverSort = sortVal === "discount-desc" ? "new" : sortVal;

  const params = { q: qVal, category: catVal, min: minVal, max: maxVal, sort: serverSort, page: append ? (page + 1) : 1 };

  // keep URL in sync (no page or checkboxes)
  history.replaceState(null, "", "?" + new URLSearchParams({
    q: params.q, category: params.category, min: params.min, max: params.max, sort: sortVal
  }).toString());
  saveFiltersToStorage();

  toggleLoadMore(append ? "Loading…" : null);
  if (!append) {
    grid.innerHTML = `<div class="card skeleton" style="height:240px"></div>`;
    if (resultsMeta) resultsMeta.textContent = "Loading products…";
  }

  try {
    const data = await searchProducts(params);
    let items = data.items || [];

    // Apply client-only filters/sort
    items = applyClientOnlyFilters(items, {
      onlySale: !!onlySaleEl?.checked,
      inStock:  !!inStockEl?.checked,
      sort: sortVal
    });

    if (!append) {
      page = 1;
      done = items.length === 0;

      if (!items.length) {
        updatePriceHints([]);
        renderActiveFilters();
        if (resultsMeta) resultsMeta.textContent = "0 products";
        grid.innerHTML = `
          <div class="card" style="text-align:center">
            <h4>No products found</h4>
            <p class="price">Try adjusting your filters.</p>
          </div>`;
        toggleLoadMore();
        return;
      }

      const prices = items.map(p => p.price).filter(Number.isFinite);
      const minC = Math.min(...prices), maxC = Math.max(...prices);
      if (resultsMeta) {
        resultsMeta.textContent = `${items.length} product${items.length > 1 ? "s" : ""} • ${euro(minC)}–${euro(maxC)}`;
      }

      updatePriceHints(items);
      renderActiveFilters();
      grid.innerHTML = items.map(productCard).join("");
      toggleLoadMore(done ? "No more items" : null);
      return;
    }

    // append mode
    if (!items.length) {
      done = true;
      toggleLoadMore("No more items");
      return;
    }
    page += 1;
    grid.insertAdjacentHTML("beforeend", items.map(productCard).join(""));
    toggleLoadMore();

  } catch (err) {
    console.error("Failed to load products:", err);
    if (!append) {
      if (resultsMeta) resultsMeta.textContent = "Error loading products";
      grid.innerHTML = `
        <div class="card" style="text-align:center">
          <h4>Error</h4>
          <p class="price">Please try again.</p>
        </div>`;
    }
    toggleLoadMore();
  } finally {
    loading = false;
  }
}

/* ---------- Load more toggle ---------- */
function toggleLoadMore(label) {
  if (!loadMoreBtn) return;
  if (done) { loadMoreBtn.style.display = "none"; return; }
  loadMoreBtn.style.display = "inline-block";
  loadMoreBtn.disabled = !!label && label.includes("Loading");
  loadMoreBtn.textContent = label || "Load more";
}

/* ---------- Reset then load ---------- */
function resetAndLoad() { page = 1; done = false; load({ append: false }); }

/* ---------- Live filters (debounced) ---------- */
const ids = ["q","category","min","max","sort","onlySale","inStock"];
const filterEls = ids.map(id => document.getElementById(id)).filter(Boolean);
const debouncedLoad = (() => { let t; return () => { clearTimeout(t); t = setTimeout(resetAndLoad, 250); }; })();
filterEls.forEach(el => {
  const ev = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";
  el.addEventListener(ev, debouncedLoad);
});

// “chips” clear event
document.body.addEventListener("filters:changed", resetAndLoad);

// Hide old Apply (we do live filtering now)
const applyBtn = document.getElementById("apply");
if (applyBtn) applyBtn.style.display = "none";

// Clear all button
const clearBtn = document.getElementById("clearFilters");
if (clearBtn) clearBtn.addEventListener("click", () => { clearAllFilters(); resetAndLoad(); });

/* ---------- Density toggle ---------- */
densityToggle?.addEventListener("click", () => {
  const gridEl = document.querySelector(".product-grid") || grid?.parentElement;
  gridEl?.classList.toggle("compact");
  densityToggle.textContent = gridEl?.classList.contains("compact") ? "Comfortable view" : "Compact view";
});

/* ---------- Initial load ---------- */
resetAndLoad();
