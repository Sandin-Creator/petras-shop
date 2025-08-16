async function fetchJson(url, opts = {}) {
  const r = await fetch(url, opts);
  let data = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error((data && data.error) || r.statusText || "Request failed");
  return data;
}

export const api = {
  async me() { return fetchJson("/api/auth/me"); },
  async logout() { return fetchJson("/api/auth/logout", { method: "POST" }); },

  async listProducts() { return fetchJson("/api/products"); },
  async createProduct(payload) {
    return fetchJson("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
  },
  async updateProduct(id, payload) {
    return fetchJson(`/api/products/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
  },
  async deleteProduct(id) { return fetchJson(`/api/products/${id}`, { method: "DELETE" }); },
  async patchStock(id, delta) {
    return fetchJson(`/api/products/${id}/stock`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }),
    });
  },
  async patchVisibility(id, hidden) {
    return fetchJson(`/api/products/${id}/visibility`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }),
    });
  },
  async uploadImage(file) {
    const fd = new FormData(); fd.append("image", file);
    return fetchJson("/api/upload", { method: "POST", body: fd });
  },
};
