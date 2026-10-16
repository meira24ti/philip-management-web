const sharp = require("sharp");
const path = require("path");

// Use the company's actual P. mark, retaining its shape and soft edges.
let markPromise;
function loadWatermark() {
  if (!markPromise) {
    markPromise = sharp(path.join(__dirname, "../assets/company-mark.jpeg"))
      .trim({ background: "#ffffff", threshold: 30 })
      .removeAlpha().raw().toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        const pixels = Buffer.alloc(info.width * info.height * 4);
        for (let i = 0; i < info.width * info.height; i++) {
          const darkness = 255 - Math.min(data[i * info.channels + 1], data[i * info.channels + 2]);
          pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = 255;
          pixels[i * 4 + 3] = darkness < 35 ? 0 : Math.round(darkness * 0.38);
        }
        return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
      }).catch(error => { markPromise = undefined; throw error; });
  }
  return markPromise;
}

async function watermarkPropertyPhoto(source, destination) {
  let normalized;
  try {
    const input = sharp(source, { limitInputPixels: 40000000, failOn: "error" });
    const metadata = await input.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format) || metadata.pages > 1) throw new Error("Unsupported image");
    normalized = await input
      .rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" }).toBuffer({ resolveWithObject: true });
  } catch {
    const error = new Error("Foto tidak dapat dibaca atau terlalu besar. Gunakan JPG, PNG, atau WEBP maksimal 40 megapiksel.");
    error.statusCode = 400;
    throw error;
  }
  const size = Math.max(1, Math.round(Math.min(normalized.info.width, normalized.info.height) * 0.095));
  const mark = await sharp(await loadWatermark()).resize({ width: size, height: size, fit: "inside" }).toBuffer();
  const output = sharp(normalized.data).composite([{ input: mark, gravity: "centre" }]).jpeg({ quality: 92, mozjpeg: true });
  return destination ? output.toFile(destination) : output.toBuffer();
}

module.exports = { watermarkPropertyPhoto };
