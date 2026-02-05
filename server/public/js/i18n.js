// /public/js/i18n.js
const DICT_CACHE = {};
let CURRENT_LANG = "en";
let OBSERVER = null;

export function getLang() { return CURRENT_LANG; }
export function t(key, fallback = "") {
  const d = DICT_CACHE[CURRENT_LANG] || {};
  return (d && d[key]) || fallback || key;
}

async function fetchDict(lang) {
  if (DICT_CACHE[lang]) return DICT_CACHE[lang];
  const res = await fetch(`/i18n/${lang}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Missing translation file: ${lang}`);
  DICT_CACHE[lang] = await res.json();
  return DICT_CACHE[lang];
}

function applyOne(el, dict) {
  const key = el.dataset.i18n;
  if (!key) return;

  // Choose target attribute: text (default), placeholder, title, aria-label, html
  const attr = el.dataset.i18nAttr || "text";
  const val = dict[key];
  if (val == null) return;

  if (attr === "placeholder" && "placeholder" in el) el.placeholder = val;
  else if (attr === "title") el.title = val;
  else if (attr.startsWith("aria-")) el.setAttribute(attr, val);
  else if (attr === "html") el.innerHTML = val;
  else el.textContent = val;
}

function translateDom(root = document) {
  const dict = DICT_CACHE[CURRENT_LANG] || {};
  root.querySelectorAll("[data-i18n]").forEach(el => applyOne(el, dict));
  // Also translate options in selects (already marked with data-i18n)
  root.querySelectorAll("option[data-i18n]").forEach(el => applyOne(el, dict));
}

function startObserver() {
  if (OBSERVER) return;
  OBSERVER = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.("[data-i18n]")) applyOne(node, DICT_CACHE[CURRENT_LANG] || {});
        // translate any new subtree content (quickview, product cards, etc.)
        translateDom(node);
      });
    }
  });
  OBSERVER.observe(document.body, { childList: true, subtree: true });
}

export async function loadLang(lang) {
  try {
    CURRENT_LANG = lang;
    const dict = await fetchDict(lang);
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    translateDom(document);
    // keep price/number formats separate (you already handle € elsewhere)
    return dict;
  } catch (err) {
    console.error("Language load failed:", err);
  }
}

function highlight(flagsEl, lang) {
  if (!flagsEl) return;
  flagsEl.querySelectorAll("img[data-lang]").forEach(img => {
    img.classList.toggle("active", img.dataset.lang === lang);
  });
}

export function initLang() {
  const saved = localStorage.getItem("lang") || "en";
  const flags = document.getElementById("langFlags");

  // wire clicks
  if (flags) {
    flags.addEventListener("click", async (e) => {
      const img = e.target.closest("img[data-lang]");
      if (!img) return;
      const lang = img.dataset.lang;
      await loadLang(lang);
      highlight(flags, lang);
    });
  }

  // initial load + highlight + dynamic updates
  loadLang(saved).then(() => highlight(flags, saved));
  startObserver();
}
