export async function searchProducts(params) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch("/api/products?" + qs);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json(); // { items, total, page }
}
