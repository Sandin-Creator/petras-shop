// /public/admin/js/api.js

// Default fetch options for this app
const DEFAULT_OPTS = {
  credentials: "include",                 // ensure session cookies are sent
  headers: { Accept: "application/json" } // prefer JSON responses
};

async function fetchJson(url, opts = {}, { timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(url, { ...DEFAULT_OPTS, ...opts, signal: controller.signal });
  } catch (networkErr) {
    clearTimeout(timer);
    // Network errors or aborted requests
    const msg = networkErr?.name === "AbortError"
      ? "Request timed out"
      : "Network error";
    throw new Error(msg);
  }
  clearTimeout(timer);

  // Try to parse JSON only if the content-type looks like JSON
  const ct = res.headers.get("content-type") || "";
  let data = null;
  if (ct.includes("application/json")) {
    try { data = await res.json(); } catch (e) { console.debug(e); }
  } else {
    // non-JSON responses (e.g., HTML error pages)
    try { data = { error: await res.text() }; } catch (e) { console.debug(e); }
  }

  if (!res.ok) {
    // Friendly messages for common cases
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
  async me() { return fetchJson("/api/auth/me"); },
  async logout() { return fetchJson("/api/auth/logout", { method: "POST" }); },

  // Products
  async listProducts() { return fetchJson("/api/products"); },
  async createProduct(payload) {
    return fetchJson("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  async updateProduct(id, payload) {
    return fetchJson(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  async deleteProduct(id) {
    return fetchJson(`/api/products/${id}`, { method: "DELETE" });
  },
  async patchStock(id, delta) {
    return fetchJson(`/api/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta })
    });
  },
  async patchVisibility(id, hidden) {
    return fetchJson(`/api/products/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden })
    });
  },

  // Upload (Multer route accepts field "file"; stick to that)
  async uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file); // backend also supports "image", but we standardized on "file"
    try {
      return await fetchJson("/api/upload", { method: "POST", body: fd }, { timeout: 30000 });
    } catch (err) {
      // Map common backend messages to friendlier ones (keeps original as fallback)
      const msg = String(err.message || "").toLowerCase();
      if (msg.includes("too large")) throw new Error("Image must be under 5MB");
      if (msg.includes("only image")) throw new Error("Only image files are allowed");
      throw err;
    }
  }
};
