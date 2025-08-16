// server/routes/auth.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma"); // must export a PrismaClient instance

const ROLES = new Set(["ADMIN", "STAFF"]);

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    password = typeof password === "string" ? password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const u = await prisma.user.findUnique({ where: { email } });
    if (!u || !u.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const role = ROLES.has(u.role) ? u.role : "STAFF";

    // Store both an object and flat fields (handy for middleware)
    req.session.user = { id: u.id, email: u.email, role };
    req.session.userId = u.id;
    req.session.role = role;

    res.json({ user: { id: u.id, email: u.email, role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  const u = req.session?.user || null;
  res.json({ user: u ? { id: u.id, email: u.email, role: u.role } : null });
});

module.exports = router;
