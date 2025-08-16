// server/server.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const FileStoreFactory = require("session-file-store");

// 1) Trust proxy for secure cookies behind Render/NGINX
const app = express();
app.set("trust proxy", 1);

// Parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Session store selection
const FileStore = FileStoreFactory(session);

// (optional) Silence ENOENT spam if you keep FileStore for local dev
const originalEmit = FileStore.prototype.emit;
FileStore.prototype.emit = function (event, err, ...args) {
  if (event === "error" && err && err.code === "ENOENT" && err.syscall === "open") return;
  return originalEmit.call(this, event, err, ...args);
};

const useMemory = (process.env.SESSION_STORE || "").toLowerCase() === "memory";

// For FileStore (local dev), ensure folder exists
const sessPath = path.join(__dirname, ".sessions");
if (!useMemory && !fs.existsSync(sessPath)) fs.mkdirSync(sessPath, { recursive: true });

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
      secure: process.env.NODE_ENV === "production", // needs trust proxy above
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

// Serve public files
app.use(express.static(path.join(__dirname, "..", "public"), { extensions: ["html"] }));

// API routes
app.use("/api/upload", require("./routes/upload"));      // (keep if you have it)
app.use("/api/auth", require("./routes/auth"));          // 🔐 uses passwordHash below
app.use("/api/products", require("./routes/products"));  // CRUD + validation

// Protect /admin section
const requireAdmin = require("./middleware/requireAdmin");
const adminDir = path.join(__dirname, "..", "public", "admin");
app.use("/admin", requireAdmin, express.static(adminDir));
app.get("/admin", requireAdmin, (_, res) => res.sendFile(path.join(adminDir, "index.html")));

// Root route (storefront)
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));

// 404 + 500
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// Start
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Shop running on http://localhost:${PORT}`));
