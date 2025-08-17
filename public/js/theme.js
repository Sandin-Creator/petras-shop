// /js/theme.js
(() => {
  const root = document.documentElement;
  const btn  = document.getElementById("themeToggle");
  if (!btn) return;

  // Helper: apply & reflect current state
  function apply(theme){
    if (theme) {
      root.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } else {
      root.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    }
    const dark = (root.getAttribute("data-theme") || "").toLowerCase() === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.textContent = dark ? "☀️" : "🌙";
  }

  // On load: saved -> use; else system -> maybe dark; else light
  const saved = localStorage.getItem("theme");
  if (saved) {
    apply(saved);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    apply(prefersDark.matches ? "dark" : "light");
    // keep in sync with system if user never toggles
    prefersDark.addEventListener?.("change", e => {
      if (!localStorage.getItem("theme")) apply(e.matches ? "dark" : "light");
    });
  }

  // Toggle on click
  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "light";
    apply(current === "dark" ? "light" : "dark");
  });
})();
