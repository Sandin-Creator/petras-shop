// /public/js/admin/api.js

// Default fetch options for this app
const DEFAULT_OPTS = {
  credentials: "include",
  headers: { Accept: "application/json" }
};

async function fetchJson(url, opts = {}, { timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(url, { ...DEFAULT_OPTS, ...opts, signal: controller.signal });
  } catch (networkErr) {
    clearTimeout(timer);
    const msg = networkErr?.name === "AbortError" ? "Request timed out" : "Network error";
    throw new Error(msg);
  }
  clearTimeout(timer);

  const ct = res.headers.get("content-type") || "";
  let data = null;
  if (ct.includes("application/json")) {
    try { data = await res.json(); } catch {}
  } else {
    try { data = { error: await res.text() }; } catch {}
  }

  if (!res.ok) {
    if (res.status === 413) throw new Error("File too large");
    if (res.status === 415) throw new Error("Unsupported file type");
    if (res.status === 401) throw new Error("Unauthorized");
    if (res.status === 403) throw new Error("Forbidden");
    if (res.status === 404) throw new Error("Not found");
    const serverMsg = (data && (data.error || data.message)) || res.statusText;
    throw new Error(serverMsg || "Request failed");
  }

  return data;
}

export const api = {
  // Auth
  me() { return fetchJson("/api/auth/me"); },
  logout() { return fetchJson("/api/auth/logout", { method: "POST" }); },

  // Products
  listProducts() { return fetchJson("/api/products"); },
  createProduct(payload) {
    return fetchJson("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  updateProduct(id, payload) {
    return fetchJson(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  deleteProduct(id) { return fetchJson(`/api/products/${id}`, { method: "DELETE" }); },
  patchStock(id, delta) {
    return fetchJson(`/api/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta })
    });
  },
  patchVisibility(id, hidden) {
    return fetchJson(`/api/products/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden })
    });
  },

  // Upload — supports optional { bg: boolean }
  async uploadImage(file, { bg = true } = {}) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bg", bg ? "true" : "false"); // server decides background removal based on this
    try {
      return await fetchJson("/api/upload", { method: "POST", body: fd }, { timeout: 30000 });
    } catch (err) {
      const msg = String(err.message || "").toLowerCase();
      if (msg.includes("too large")) throw new Error("Image must be under 5MB");
      if (msg.includes("only image")) throw new Error("Only image files are allowed");
      throw err;
    }
  }
};
