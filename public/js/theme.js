// /js/theme.js
(() => {
  const root = document.documentElement;
  const btn  = document.getElementById("themeToggle");
  if (!btn) return; // no toggle button present

  const STORAGE_KEY = "theme";

  /** Update DOM + storage */
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateButton(theme);
  }

  /** Remove stored theme (system preference takes over) */
  function clearTheme() {
    root.removeAttribute("data-theme");
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Reflect current theme state in toggle button */
  function updateButton(theme) {
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.textContent = dark ? "☀️" : "🌙";
  }

  /** Initialize on load */
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTheme(saved);
      return;
    }

    // no saved theme → follow system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const systemTheme = prefersDark.matches ? "dark" : "light";
    setTheme(systemTheme);

    // keep in sync if user never toggled manually
    prefersDark.addEventListener("change", e => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? "dark" : "light");
      }
    });
  }

  /** Toggle handler */
  function toggleTheme() {
    const current = root.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  }

  // Init + bind
  initTheme();
  btn.addEventListener("click", toggleTheme);
})();
