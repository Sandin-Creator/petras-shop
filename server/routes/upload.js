const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

// storage to /public/uploads, keep original name with timestamp prefix
const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}-${safe}`);
  }
});
const upload = multer({ storage });

router.post("/", requireAdmin, upload.single("image"), (req, res) => {
  // public URL to save into product.imageUrl
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
