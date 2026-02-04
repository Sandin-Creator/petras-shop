// quickview.js
(() => {
  const grid = document.getElementById("grid");
  if (!grid) return;

  // Ensure modal shell exists
  let qv = document.getElementById("quickview");
  if (!qv) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="quickview" class="modal" hidden aria-hidden="true">
        <div class="modal-backdrop" data-close></div>
        <div class="modal-dialog card" role="dialog" aria-modal="true" aria-labelledby="qv-title">
          <button class="modal-close btn" type="button" data-close aria-label="Close">×</button>
          <div id="qv-body"><p class="price">Loading…</p></div>
        </div>
      </div>
    `);
    qv = document.getElementById("quickview");
  }
  const qvBody = document.getElementById("qv-body");
  const dialog = qv.querySelector(".modal-dialog");

  // Helpers from storefront or fallbacks
  const PLACEHOLDER = window.PLACEHOLDER || "/images/placeholder.png";
  const euro = window.euro || ((c=0)=> new Intl.NumberFormat("fi-FI",{style:"currency",currency:"EUR"}).format((c||0)/100));
  const computeBadge = window.computeBadge || (()=> "");

  let lastFocused = null;

  function openQuickView(slug){
    if (!slug) return;
    lastFocused = document.activeElement;

    document.body.style.overflow = "hidden";
    qv.hidden = false;
    qv.setAttribute("aria-hidden","false");
    qvBody.innerHTML = `<p class="price">Loading…</p>`;
    qv.querySelector(".modal-close")?.focus();

    fetch(`/api/products/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => {
        const imgSrc = (p.imageUrl && p.imageUrl.trim()) ? p.imageUrl : PLACEHOLDER;
        const badge = computeBadge(p);

        // Ribbon on dialog
        if (badge) dialog.setAttribute("data-badge", badge);
        else dialog.removeAttribute("data-badge");

        // Sale price pair if oldPrice > price
        const isSale = Number.isFinite(p.oldPrice) && Number.isFinite(p.price) && p.oldPrice > p.price;
        const priceBlock = isSale
          ? `<div class="price"><span class="now">${euro(p.price)}</span><span class="was">${euro(p.oldPrice)}</span></div>`
          : `<div class="price">${euro(p.price)}</div>`;

        qvBody.innerHTML = `
          <img src="${imgSrc}" alt="${p.name}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
          <div class="meta">
            <h3 id="qv-title">${p.name}</h3>
            ${priceBlock}
          </div>
          <p>Category: ${p.category || "—"} &nbsp;•&nbsp; Stock: ${typeof p.stock==="number"?p.stock:"—"}</p>
          <p class="price">Added: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</p>
          <div class="actions">
            <a class="btn btn-accent" href="/product.html?slug=${encodeURIComponent(p.slug)}">View details</a>
            <button class="btn" data-close>Close</button>
          </div>`;
      })
      .catch(() => {
        dialog.removeAttribute("data-badge");
        qvBody.innerHTML = `<p class="price">Couldn’t load product. Please try again.</p>`;
      });
  }

  function closeQuickView(){
    qv.hidden = true;
    qv.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
    dialog.removeAttribute("data-badge");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // Open (delegated from grid)
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quick]");
    if (!btn) return;
    e.preventDefault();
    openQuickView(btn.getAttribute("data-slug"));
  });

  // Close
  qv.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]") || e.target.classList.contains("modal-backdrop")) {
      closeQuickView();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !qv.hidden) closeQuickView();
  });
})();
