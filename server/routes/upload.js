// server/routes/upload.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

// /public/uploads (ensure it exists)
const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9\-]+/gi, "-")
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Accepts field "file" (new) OR "image" (old)
router.post(
  "/",
  requireAdmin,
  upload.fields([{ name: "file", maxCount: 1 }, { name: "image", maxCount: 1 }]),
  (req, res) => {
    const f =
      (req.files?.file && req.files.file[0]) ||
      (req.files?.image && req.files.image[0]);

    if (!f) return res.status(400).json({ error: "No file uploaded" });

    const url = `/uploads/${f.filename}`; // public URL to store in product.imageUrl
    return res.json({ url });
  }
);

module.exports = router;
