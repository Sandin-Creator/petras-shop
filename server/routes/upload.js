// server/routes/upload.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const requireAdmin = require("../middleware/requireAdmin");

/* -------------------- IMG.LY background removal -------------------- */
let removeBackground = null;
const BG_REMOVE_ENV = String(process.env.BG_REMOVE ?? "true") !== "false";
const BG_MAX_SIDE = Number(process.env.BG_MAX_SIDE || 0) || undefined;

try {
  const mod = require("@imgly/background-removal-node");
  removeBackground =
    mod?.removeBackground ||
    mod?.default?.removeBackground ||
    mod?.default ||
    mod;
} catch {
  removeBackground = null;
}

/* -------------------- Writable uploads dir -------------------- */
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

const ENV_OR_PUBLIC =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "public", "uploads");
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
    const base =
      path
        .basename(file.originalname || "upload", ext)
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]+/g, "")
        .replace(/[^a-z0-9\-]+/gi, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60) || "image";
    const rand = crypto.randomBytes(4).toString("hex");
    cb(null, `${Date.now()}-${base}-${rand}${ext || ".png"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

/* -------------------- Helpers -------------------- */
const publicUrlFor = (filePath) => "/uploads/" + path.basename(filePath);
const cutOutPath = (inputPath) =>
  inputPath.replace(/\.(png|jpg|jpeg|webp|gif|avif|svg)$/i, "") + "-cut.png";

function wantsBgRemoval(req) {
  const raw = (req.body?.bg ?? req.query?.bg);
  if (raw == null) return BG_REMOVE_ENV;
  const v = String(raw).toLowerCase().trim();
  if (["false", "0", "no", "off"].includes(v)) return false;
  if (["true", "1", "yes", "on"].includes(v)) return true;
  return BG_REMOVE_ENV;
}

// Replace your current /list with this improved version
router.get("/list", requireAdmin, (req, res) => {
  try {
    const entries = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      // allow only image extensions
      .filter(name => /\.(png|jpe?g|webp|gif|avif)$/i.test(name))
      // skip dotfiles or temp files
      .filter(name => !name.startsWith(".") && !name.endsWith(".tmp"));

    // sort by mtime desc (newest first)
    const withTimes = entries.map(name => {
      const full = path.join(UPLOAD_DIR, name);
      const st = fs.statSync(full);
      return { name, mtime: st.mtimeMs };
    }).sort((a, b) => b.mtime - a.mtime);

    res.json(withTimes.map(x => x.name));
  } catch (e) {
    res.status(500).json({ error: "Failed to list uploads" });
  }
});



/* -------------------- Route -------------------- */
router.post(
  "/",
  requireAdmin,
  upload.fields([{ name: "file", maxCount: 1 }, { name: "image", maxCount: 1 }]),
  async (req, res) => {
    const f =
      (req.files?.file && req.files.file[0]) ||
      (req.files?.image && req.files.image[0]);

    if (!f) return res.status(400).json({ error: "No file uploaded" });

    const inPath = f.path || path.join(UPLOAD_DIR, f.filename);
    const isVector = /\.svg$/i.test(inPath);
    const wantCut = wantsBgRemoval(req);
    const canCut = wantCut && removeBackground && !isVector;

    if (!canCut) {
      return res.json({
        url: publicUrlFor(inPath),
        filename: path.basename(inPath),
        size: f.size ?? fs.statSync(inPath).size,
        mimetype: f.mimetype || "image/*",
        bgRemoved: false,
        reason: !wantCut ? "user_opt_out" : (!removeBackground ? "lib_missing" : (isVector ? "vector_svg" : "unknown")),
      });
    }

    const outPath = cutOutPath(inPath);

    try {
      // 1) Normalize to PNG (RGBA) and write a tmp-normalized file
      let buf = fs.readFileSync(inPath);
      let normPath = inPath.replace(/\.(png|jpg|jpeg|webp|gif|avif|svg)$/i, "") + ".norm.png";
      try {
        let sh = sharp(buf, { failOn: false });
        if (BG_MAX_SIDE) {
          const meta = await sh.metadata();
          const max = Math.max(meta.width || 0, meta.height || 0);
          if (max > BG_MAX_SIDE) {
            sh = sh.resize({ width: BG_MAX_SIDE, height: BG_MAX_SIDE, fit: "inside" });
          }
        }
        buf = await sh.png({ force: true }).toBuffer();
        fs.writeFileSync(normPath, buf);
      } catch {
        // if sharp fails, still try with the original buffer; also write it as .norm.png
        try { fs.writeFileSync(normPath, buf); } catch {}
      }

      // 2) Try several input shapes to satisfy library format sniffing
      let result, lastErr;

      // a) Buffer
      try {
        result = await removeBackground(buf, {
          ...(BG_MAX_SIDE ? { maxSide: BG_MAX_SIDE } : {}),
        });
      } catch (e1) {
        lastErr = e1;
        // b) Blob with explicit type
        try {
          const blob = new Blob([buf], { type: "image/png" });
          result = await removeBackground(blob, {
            ...(BG_MAX_SIDE ? { maxSide: BG_MAX_SIDE } : {}),
          });
        } catch (e2) {
          lastErr = e2;
          // c) File path (string)
          result = await removeBackground(normPath, {
            ...(BG_MAX_SIDE ? { maxSide: BG_MAX_SIDE } : {}),
          });
        }
      }

      const payload =
        typeof result?.arrayBuffer === "function"
          ? Buffer.from(await result.arrayBuffer())
          : Buffer.isBuffer(result)
            ? result
            : Buffer.from(result);

      fs.writeFileSync(outPath, payload);
      try { fs.unlinkSync(inPath); } catch {}
      try { fs.unlinkSync(normPath); } catch {}

      return res.json({
        url: publicUrlFor(outPath),
        filename: path.basename(outPath),
        size: fs.statSync(outPath).size,
        mimetype: "image/png",
        bgRemoved: true,
      });
    } catch (e) {
      console.warn("BG removal failed; returning original:", e?.message || e);
      return res.json({
        url: publicUrlFor(inPath),
        filename: path.basename(inPath),
        size: f.size ?? fs.statSync(inPath).size,
        mimetype: f.mimetype || "image/*",
        bgRemoved: false,
        reason: "cut_failed",
      });
    }
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
  if (err) return res.status(400).json({ error: err.message || "Upload failed" });
  res.status(500).json({ error: "Unknown upload error" });
});

module.exports = router;
