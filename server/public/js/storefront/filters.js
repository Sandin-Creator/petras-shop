import { $, euro } from "./utils.js";

export function getCurrentFilters() {
  return {
    q: $("#q").value.trim(),
    category: $("#category").value,
    min: $("#min").value,
    max: $("#max").value,
    sort: $("#sort").value || "new",
  };
}

export function renderActiveFilters() {
  const wrap = $("#active-filters");
  if (!wrap) return;
  const f = getCurrentFilters();
  const chips = [];
  if (f.q)        chips.push({ key: "q",        label: `Search: “${f.q}”` });
  if (f.category) chips.push({ key: "category", label: `Category: ${f.category}` });
  if (f.min)      chips.push({ key: "min",      label: `Min €${f.min}` });
  if (f.max)      chips.push({ key: "max",      label: `Max €${f.max}` });

  wrap.innerHTML = chips.map(c => `
    <span class="filter-chip" data-key="${c.key}">
      ${c.label}
      <button class="x" aria-label="Remove ${c.label}">&times;</button>
    </span>
  `).join("");

  wrap.querySelectorAll(".filter-chip .x").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.closest(".filter-chip").dataset.key;
      const el = document.getElementById(key);
      if (el) el.value = "";
      // caller should call resetAndLoad()
      const ev = new CustomEvent("filters:changed", { bubbles: true });
      document.body.dispatchEvent(ev);
    });
  });
}

export function clearAllFilters() {
  ["q","category","min","max"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const sort = $("#sort"); if (sort) sort.value = "new";
  history.replaceState(null, "", location.pathname);
}

export function updatePriceHints(items) {
  const minEl = $("#min"), maxEl = $("#max");
  if (!minEl || !maxEl) return;

  if (!Array.isArray(items) || items.length === 0) {
    minEl.placeholder = "Min €";
    maxEl.placeholder = "Max €";
    return;
  }
  const prices = items.map(p => Number(p.price)).filter(Number.isFinite);
  if (!prices.length) return;

  const minC = Math.min(...prices);
  const maxC = Math.max(...prices);
  minEl.placeholder = `Min ${euro(minC)}`;
  maxEl.placeholder = `Max ${euro(maxC)}`;
  minEl.min = 0; maxEl.min = 0;
}
