import { getCompanyLogoUrl } from "./companyBrand";
import { getImageUrl } from "./imageUrl";
import { getPropertyTypeLabel } from "./propertyTypes";
import { getFlyerFeatures, hasFlyerValue, wrapCanvasText } from "./flyerContent";
import { propertiService } from "../services/propertiService";

const WIDTH = 1080;
const HEIGHT = 1920;
const MAROON = "#7E0015";
const CREAM = "#FFF9F4";
const YELLOW = "#FACC15";
const FONT = '"Poppins", sans-serif';

const offerLabel = value => ({ dijual: "DIJUAL", disewa: "DISEWAKAN", dijual_dan_disewa: "DIJUAL / DISEWAKAN" })[value] || "PENAWARAN";

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar flyer gagal dimuat. Periksa foto properti dan logo perusahaan di Pengaturan."));
    image.src = url;
  });
}

function drawPhoto(ctx, image, x, y, width, height) {
  if (!image) { ctx.fillStyle = "#5A0010"; ctx.fillRect(x, y, width, height); return; }
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

async function loadPropertyPhoto(propertyId, photo) {
  if (!propertyId || !photo.id_fotoproperti) return loadImage(getImageUrl(typeof photo === "string" ? photo : photo.url_foto));
  const url = URL.createObjectURL(await propertiService.downloadFoto(propertyId, photo.id_fotoproperti));
  try { return await loadImage(url); }
  finally { URL.revokeObjectURL(url); }
}

function drawTextBlock(ctx, text, x, y, width, height, size, weight = 700, align = "center") {
  let lines;
  let lineHeight;
  do {
    ctx.font = weight + " " + size + "px " + FONT;
    lines = wrapCanvasText(ctx, text, width);
    lineHeight = size * 1.24;
    if (lines.length * lineHeight <= height || size <= 8) break;
    size -= 1;
  } while (size > 0);
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const start = y + (height - lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => ctx.fillText(line, align === "left" ? x : x + width / 2, start + index * lineHeight));
}

function drawCheck(ctx, x, y) {
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 2, y + 8); ctx.lineTo(x + 16, y - 14); ctx.stroke();
}

// Remove only the surrounding blank margin; retain the logo image itself.
function drawBrandImage(ctx, image, x, y, width, height) {
  const scratch = document.createElement("canvas");
  const ratio = Math.min(1, 1200 / Math.max(image.width, image.height));
  scratch.width = Math.round(image.width * ratio); scratch.height = Math.round(image.height * ratio);
  const sc = scratch.getContext("2d");
  sc.drawImage(image, 0, 0, scratch.width, scratch.height);
  const pixels = sc.getImageData(0, 0, scratch.width, scratch.height).data;
  let left = scratch.width, top = scratch.height, right = 0, bottom = 0;
  for (let py = 0; py < scratch.height; py++) for (let px = 0; px < scratch.width; px++) {
    const offset = (py * scratch.width + px) * 4;
    if (pixels[offset + 3] > 30 && Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) < 220) {
      left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
  }
  if (right <= left || bottom <= top) { left = top = 0; right = scratch.width - 1; bottom = scratch.height - 1; }
  const sourceWidth = (right - left + 1) / ratio, sourceHeight = (bottom - top + 1) / ratio;
  const scale = Math.min((width - 24) / sourceWidth, (height - 24) / sourceHeight);
  const dw = sourceWidth * scale, dh = sourceHeight * scale;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x + (width - dw) / 2 - 12, y + (height - dh) / 2 - 12, dw + 24, dh + 24);
  ctx.drawImage(image, left / ratio, top / ratio, sourceWidth, sourceHeight, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
}

export async function generateFlyerPNG(properti, options = {}) {
  await Promise.all([600, 700, 800].map(weight => document.fonts.load(weight + " 40px Poppins")));
  if (!document.fonts.check("800 40px Poppins")) throw new Error("Font Poppins belum termuat. Muat ulang halaman lalu coba lagi.");
  const scale = Math.max(1, Math.min(Number(options.scale) || 2, 3));
  const actor = options.actor || {};
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale; canvas.height = HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas browser tidak tersedia");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";

  const photos = [...(properti.foto_properti || [])].sort((a, b) => Number(b.is_cover || 0) - Number(a.is_cover || 0) || (a.urutan || 0) - (b.urutan || 0)).slice(0, 4);
  const [images, logo] = await Promise.all([
    Promise.all(photos.map(photo => loadPropertyPhoto(properti.id_properti || properti.id, photo))),
    loadImage(getCompanyLogoUrl(options.logoUrl)),
  ]);

  ctx.fillStyle = MAROON; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawPhoto(ctx, images[0], 0, 0, WIDTH, 710);
  const fade = ctx.createLinearGradient(0, 540, 0, 710);
  fade.addColorStop(0, "rgba(126,0,21,0)"); fade.addColorStop(1, MAROON);
  ctx.fillStyle = fade; ctx.fillRect(0, 540, WIDTH, 170);
  const thumbnails = [
    { x: 48, y: 616, width: 290, height: 208, image: images[1] || images[0] },
    { x: 340, y: 576, width: 400, height: 266, image: images[2] || images[0] },
    { x: 742, y: 616, width: 290, height: 208, image: images[3] || images[0] },
  ];
  // Draw the middle frame last, as in the supplied reference.
  [thumbnails[0], thumbnails[2], thumbnails[1]].forEach(({ x, y, width, height, image }) => {
    ctx.fillStyle = CREAM; ctx.fillRect(x - 4, y - 4, width + 8, height + 8);
    drawPhoto(ctx, image, x, y, width, height);
  });

  const type = getPropertyTypeLabel(properti.kategori, properti.subkategori, properti.kategori_kombinasi_1, properti.kategori_kombinasi_2).toUpperCase();
  ctx.fillStyle = YELLOW;
  drawTextBlock(ctx, offerLabel(properti.jenis_penawaran), 60, 870, 960, 88, 70, 800);
  ctx.fillStyle = CREAM;
  drawTextBlock(ctx, type, 60, 962, 960, 94, 46, 800);
  const location = properti.nama_jalan || properti.area_kecamatan || properti.kota || "Alamat belum diisi";
  drawTextBlock(ctx, location, 75, 1068, 930, 132, 39, 700);

  const prices = [];
  const money = value => "Rp " + Number(value).toLocaleString("id-ID");
  if (["dijual", "dijual_dan_disewa"].includes(properti.jenis_penawaran) && hasFlyerValue(properti.harga_jual)) prices.push("JUAL " + money(properti.harga_jual));
  if (["disewa", "dijual_dan_disewa"].includes(properti.jenis_penawaran) && hasFlyerValue(properti.harga_sewa)) prices.push("SEWA " + money(properti.harga_sewa) + "/thn");
  ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.roundRect(60, 1220, 960, 142, 16); ctx.fill();
  ctx.fillStyle = MAROON;
  drawTextBlock(ctx, prices.length ? prices.join("\n") : "Hubungi kami untuk harga", 85, 1232, 910, 118, prices.length > 1 ? 43 : 57, 800);

  ctx.strokeStyle = CREAM; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(90, 1400); ctx.lineTo(990, 1400); ctx.stroke();
  getFlyerFeatures(properti).forEach((lines, index) => {
    const x = 105 + (index % 3) * 305;
    const y = 1420 + Math.floor(index / 3) * 96;
    drawCheck(ctx, x, y + 39);
    ctx.fillStyle = CREAM;
    drawTextBlock(ctx, lines.join("\n"), x + 30, y, 247, 82, 27, 600, "left");
  });
  ctx.beginPath(); ctx.moveTo(90, 1630); ctx.lineTo(990, 1630); ctx.stroke();
  ctx.fillStyle = CREAM;
  drawTextBlock(ctx, "Contact Us For Free Consultation", 70, 1650, 940, 50, 29, 700);
  const contact = [actor.nama, actor.no_hp].filter(hasFlyerValue).join(" • ");
  if (contact) drawTextBlock(ctx, contact, 80, 1702, 920, 57, 28, 700);
  drawTextBlock(ctx, "Instagram: @philip.estate", 80, 1762, 920, 44, 27, 600);
  drawBrandImage(ctx, logo, 305, 1816, 470, 92);

  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Gagal membuat file flyer")), "image/png"));
}

export function downloadFlyer(blob, nama = "flyer-properti.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = nama;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
