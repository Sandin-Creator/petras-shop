// server/routes/auth.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const ROLES = new Set(["ADMIN", "STAFF"]);
const ACCESS_CODE = (process.env.ADMIN_ACCESS_CODE || "").trim();

router.post("/login", async (req, res) => {
  try {
    let { email, password, code } = req.body || {};
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    password = typeof password === "string" ? password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    // extra owner code (if configured)
    if (ACCESS_CODE && String(code || "").trim() !== ACCESS_CODE) {
      return res.status(401).json({ error: "Invalid code" });
    }

    const u = await prisma.user.findUnique({ where: { email } });
    if (!u?.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const role = ROLES.has(u.role) ? u.role : "STAFF";

    // Store both object and flat fields (handy for middleware)
    req.session.user   = { id: u.id, email: u.email, role };
    req.session.userId = u.id;
    req.session.role   = role;

    return res.json({ ok: true, user: { id: u.id, email: u.email, role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  const u = req.session?.user || null;
  res.json({ user: u ? { id: u.id, email: String(u.email || "").toLowerCase(), role: u.role } : null });
});

module.exports = router;
