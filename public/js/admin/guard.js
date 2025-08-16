// Redirect to login if not authenticated (runs on import)
(async () => {
  try {
    const r = await fetch("/api/auth/me");
    const { user } = await r.json();
    if (!user) location.href = "/login.html?next=/admin";
  } catch {
    location.href = "/login.html?next=/admin";
  }
})();
