// server/routes/upload.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

/* -------------------- Choose a writable uploads dir -------------------- */
function ensureWritableDir(preferred, fallback) {
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

// Prefer env (e.g. /var/data/uploads on Render) → else fall back to:
//   1) ../public/uploads (same behavior as before)
//   2) ./uploads at project root (last-resort local)
const ENV_OR_PUBLIC = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "public", "uploads");
const LOCAL_FALLBACK = path.join(process.cwd(), "uploads");
const UPLOAD_DIR = ensureWritableDir(ENV_OR_PUBLIC, LOCAL_FALLBACK);

/* -------------------- Limits & validation -------------------- */
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 5);
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const IMAGE_MIME = /^(image\/(png|jpe?g|gif|webp|svg\+xml|avif))$/i;

const fileFilter = (_req, file, cb) => {
  if (!IMAGE_MIME.test(file.mimetype || "")) {
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image uploads are allowed"));
  }
  cb(null, true);
};

/* -------------------- Multer storage -------------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "upload", ext)
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]+/g, "")   // strip non-ASCII
      .replace(/[^a-z0-9\-]+/gi, "-")  // slugify
      .replace(/(^-|-$)/g, "")         // trim dashes
      .slice(0, 60) || "image";
    const rand = crypto.randomBytes(4).toString("hex");
    cb(null, `${Date.now()}-${base}-${rand}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

/* -------------------- Route -------------------- */
// Accepts field "file" (preferred) OR "image" (legacy)
router.post(
  "/",
  requireAdmin,
  upload.fields([{ name: "file", maxCount: 1 }, { name: "image", maxCount: 1 }]),
  (req, res) => {
    const f =
      (req.files?.file && req.files.file[0]) ||
      (req.files?.image && req.files.image[0]);

    if (!f) return res.status(400).json({ error: "No file uploaded" });

    // Public URL is served by server.js: app.use("/uploads", express.static(UPLOAD_DIR))
    const url = `/uploads/${f.filename}`;
    return res.json({
      url,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    });
  }
);

/* -------------------- Error handler -------------------- */
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large. Max ${MAX_FILE_SIZE_MB}MB.` });
    }
    return res.status(400).json({ error: err.message || "Upload error" });
  }
  if (err) {
    return res.status(400).json({ error: err.message || "Upload failed" });
  }
  res.status(500).json({ error: "Unknown upload error" });
});

module.exports = router;
