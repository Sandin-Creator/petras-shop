// server/middleware/requireAdmin.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async function requireAdmin(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  } catch (e) {
    next(e);
  }
};
