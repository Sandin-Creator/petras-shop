// server/middleware/requireAdmin.js
const prisma = require("../lib/prisma"); // reuse singleton

module.exports = async function requireAdmin(req, res, next) {
  try {
    const sess = req.session || {};

    // Fast path: trust session role if present
    if (sess.user?.role === "ADMIN" || sess.role === "ADMIN") return next();

    // Otherwise confirm via DB
    const userId = sess.user?.id || sess.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (u?.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });
    return next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    return res.status(500).json({ error: "server error" });
  }
};
