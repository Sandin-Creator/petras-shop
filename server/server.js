// server/server.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const FileStoreFactory = require("session-file-store");

const app = express();

// Trust proxy (Render/NGINX) so secure cookies work
app.set("trust proxy", 1);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Sessions -------------------- */
const FileStore = FileStoreFactory(session);

// Silence harmless ENOENT from file store
const originalEmit = FileStore.prototype.emit;
FileStore.prototype.emit = function (event, err, ...args) {
  if (event === "error" && err?.code === "ENOENT" && err?.syscall === "open") return;
  return originalEmit.call(this, event, err, ...args);
};

const useMemory = (process.env.SESSION_STORE || "").toLowerCase() === "memory";
const sessPath = path.join(__dirname, ".sessions");
if (!useMemory) fs.mkdirSync(sessPath, { recursive: true });

const store = useMemory
  ? new session.MemoryStore()
  : new FileStore({ path: sessPath, reapInterval: 60, retries: 1 });

app.use(
  session({
    store,
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

/* -------------------- Paths -------------------- */
const publicDir = path.join(__dirname, "..", "public");
const adminDir  = path.join(publicDir, "admin");
const requireAdmin = require("./middleware/requireAdmin");

/* -------------------- Secret-gated /login -------------------- */
const ADMIN_LOGIN_KEY = process.env.ADMIN_LOGIN_KEY || null;

// Serve /login only if ?k=<key> matches; otherwise 404
app.get("/login", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  if (ADMIN_LOGIN_KEY && req.query.k !== ADMIN_LOGIN_KEY) {
    const notFound = path.join(publicDir, "404.html");
    return fs.existsSync(notFound)
      ? res.status(404).sendFile(notFound)
      : res.status(404).send("Not found");
  }
  // NOTE: serve single-file login page
  return res.sendFile(path.join(publicDir, "login.html"));
});

// Optional short link: /<key> -> /login?k=<key>
if (ADMIN_LOGIN_KEY) {
  app.get(`/${ADMIN_LOGIN_KEY}`, (_req, res) => {
    res.redirect(`/login?k=${encodeURIComponent(ADMIN_LOGIN_KEY)}`);
  });
}

/* -------------------- Admin (protected) -------------------- */
// Prevent indexing of admin
app.use("/admin", (req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});
app.use("/admin", requireAdmin, express.static(adminDir));
app.get("/admin", requireAdmin, (_req, res) => {
  res.sendFile(path.join(adminDir, "index.html"));
});

/* -------------------- API routes -------------------- */
app.use("/api/upload", require("./routes/upload")); // your file is routes/upload.js
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));

/* -------------------- Public static -------------------- */
app.use(express.static(publicDir, { extensions: ["html"] }));

// Root (storefront)
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

/* -------------------- Errors -------------------- */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

/* -------------------- Start -------------------- */
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Shop running on http://localhost:${PORT}`);
});
