const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

// Decode and re-encode, removing scripts, trailing payloads, EXIF and oversized dimensions.
module.exports = folder => async (req, res, next) => {
  if (!req.file) return next();
  const original = req.file.path;
  let normalizedPath;
  try {
    const buffer = await fs.readFile(original);
    const image = sharp(buffer, { limitInputPixels: 20000000, failOn: "error" });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format) || metadata.pages > 1) throw new Error("Unsupported image");
    const filename = `${crypto.randomUUID()}.png`;
    const destination = path.join(__dirname, "../uploads", folder);
    await fs.mkdir(destination, { recursive: true });
    normalizedPath = path.join(destination, filename);
    await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).png().toFile(normalizedPath);
    await fs.unlink(original);
    Object.assign(req.file, { path: normalizedPath, destination, filename, mimetype: "image/png" });
    next();
  } catch {
    await fs.unlink(original).catch(() => {});
    if (normalizedPath) await fs.unlink(normalizedPath).catch(() => {});
    res.status(400).json({ message: "Gambar tidak valid. Gunakan JPG, PNG, atau WEBP statis maksimal 20 megapiksel." });
  }
};
