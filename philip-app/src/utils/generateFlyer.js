import { getImageUrl } from "./imageUrl";
import { getPropertyTypeLabel } from "./propertyTypes";

const WIDTH = 1080;
const HEIGHT = 1920;
const MAROON = "#7E0015";
const DEEP_MAROON = "#5A0010";
const CREAM = "#FFF9F4";
const ACCENT_YELLOW = "#FACC15";
const ACCENT_RED = "#DC2626";

const offerLabel = (value) => ({
  dijual: "DIJUAL",
  disewa: "DISEWAKAN",
  dijual_dan_disewa: "DIJUAL / DISEWAKAN",
}[value] || "DIJUAL");

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

const formatPrice = (value, suffix = "") => (
  hasValue(value) ? `Rp.${Number(value).toLocaleString("id-ID")}${suffix}` : null
);

const formatMetric = (value) => (hasValue(value) ? `${value} m²` : null);

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCover(ctx, image, x, y, width, height) {
  if (!image) {
    const fallback = ctx.createLinearGradient(x, y, x + width, y + height);
    fallback.addColorStop(0, "#5D302B");
    fallback.addColorStop(1, "#241116");
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, width, height);
    return;
  }

  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawPhoto(ctx, image, x, y, width, height, radius = 0) {
  ctx.save();
  if (radius) {
    roundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
  }
  drawCover(ctx, image, x, y, width, height);
  ctx.restore();
}

function drawCheck(ctx, x, y) {
  ctx.fillStyle = ACCENT_YELLOW;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = MAROON;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x - 2, y + 7);
  ctx.lineTo(x + 10, y - 8);
  ctx.stroke();
}

function fitText(ctx, text, maxWidth) {
  const fullText = String(text || "").trim();
  if (!fullText) return "";
  if (ctx.measureText(fullText).width <= maxWidth) return fullText;

  let value = fullText;
  while (value.length > 1 && ctx.measureText(`${value}...`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value.trim()}...`;
}

function drawFeature(ctx, x, y, primary, secondary) {
  const lines = [primary, secondary].filter(Boolean);
  if (!lines.length) return;

  drawCheck(ctx, x, y + 5);
  ctx.fillStyle = CREAM;
  ctx.font = "600 25px Arial, Helvetica, sans-serif";
  ctx.fillText(fitText(ctx, lines[0], 235), x + 34, y + 12);
  if (lines[1]) {
    ctx.font = "500 23px Arial, Helvetica, sans-serif";
    ctx.fillText(fitText(ctx, lines[1], 235), x + 34, y + 43);
  }
}

function drawBrandLogo(ctx, x, y, width, height) {
  ctx.fillStyle = CREAM;
  roundedRect(ctx, x, y, width, height, 4);
  ctx.fill();

  ctx.fillStyle = MAROON;
  ctx.font = "700 84px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("P", x + 30, y + 85);

  ctx.fillStyle = ACCENT_RED;
  ctx.fillRect(x + 118, y + 24, 3, height - 48);
  ctx.fillStyle = MAROON;
  ctx.font = "700 16px Arial, Helvetica, sans-serif";
  ctx.fillText("PHILIP REAL ESTATE", x + 143, y + 49);
  ctx.font = "600 12px Arial, Helvetica, sans-serif";
  ctx.fillText("JUAL | BELI | SEWA | KPR", x + 143, y + 77);
}

function loadImage(url) {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function generateFlyerPNG(properti, options = {}) {
  const scale = Math.max(1, Math.min(Number(options.scale) || 2, 3));
  const actor = options.actor || {};
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas browser tidak tersedia");

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const photos = [...(properti.foto_properti || [])]
    .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.urutan || 0) - (b.urutan || 0))
    .map((photo) => getImageUrl(typeof photo === "string" ? photo : photo?.url_foto))
    .filter(Boolean);
  const images = await Promise.all(photos.slice(0, 4).map(loadImage));

  const background = ctx.createLinearGradient(0, 680, 0, HEIGHT);
  background.addColorStop(0, MAROON);
  background.addColorStop(1, DEEP_MAROON);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Photo collage: one large cover and three framed details, matching the reference hierarchy.
  drawPhoto(ctx, images[0], 0, 0, WIDTH, 710);
  const photoFade = ctx.createLinearGradient(0, 500, 0, 710);
  photoFade.addColorStop(0, "rgba(126, 0, 21, 0)");
  photoFade.addColorStop(1, MAROON);
  ctx.fillStyle = photoFade;
  ctx.fillRect(0, 500, WIDTH, 210);

  const thumbnails = [
    { x: 42, y: 602, width: 276, height: 188, image: images[1] || images[0] },
    { x: 354, y: 565, width: 372, height: 225, image: images[2] || images[0] },
    { x: 762, y: 602, width: 276, height: 188, image: images[3] || images[0] },
  ];
  thumbnails.forEach(({ x, y, width, height, image }) => {
    ctx.fillStyle = CREAM;
    ctx.fillRect(x - 6, y - 6, width + 12, height + 12);
    drawPhoto(ctx, image, x, y, width, height, 1);
  });

  const type = getPropertyTypeLabel(properti.kategori, properti.subkategori).toUpperCase();
  const offerText = `${offerLabel(properti.jenis_penawaran)} ${type}`;
  ctx.font = "800 31px Arial, Helvetica, sans-serif";
  const renderedOffer = fitText(ctx, offerText, 820);
  const offerWidth = Math.min(900, Math.max(310, ctx.measureText(renderedOffer).width + 82));
  ctx.fillStyle = ACCENT_YELLOW;
  roundedRect(ctx, (WIDTH - offerWidth) / 2, 856, offerWidth, 66, 33);
  ctx.fill();
  ctx.fillStyle = ACCENT_RED;
  ctx.beginPath();
  ctx.arc((WIDTH - offerWidth) / 2 + 33, 889, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = MAROON;
  ctx.textAlign = "center";
  ctx.fillText(renderedOffer, WIDTH / 2 + 8, 900);

  ctx.fillStyle = CREAM;
  ctx.font = "400 42px Arial, Helvetica, sans-serif";
  const location = properti.nama_jalan || properti.area_kecamatan || properti.kota || "";
  if (location) ctx.fillText(fitText(ctx, location, 900), WIDTH / 2, 987);

  const isForSale = ["dijual", "dijual_dan_disewa"].includes(properti.jenis_penawaran);
  const isForRent = ["disewa", "dijual_dan_disewa"].includes(properti.jenis_penawaran);
  const priceLines = [
    isForSale && formatPrice(properti.harga_jual) ? `Harga Jual ${formatPrice(properti.harga_jual)}` : null,
    isForRent && formatPrice(properti.harga_sewa, "/thn") ? `Harga Sewa ${formatPrice(properti.harga_sewa, "/thn")}` : null,
  ].filter(Boolean);
  ctx.font = "400 35px Arial, Helvetica, sans-serif";
  priceLines.forEach((line, index) => {
    ctx.fillText(fitText(ctx, line, 900), WIDTH / 2, 1060 + index * 58);
  });

  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(130, 1170);
  ctx.lineTo(950, 1170);
  ctx.stroke();

  const bonus = String(properti.daftar_bonus || "")
    .split(",")
    .map((item) => item.trim())
    .find(Boolean);
  const features = [
    [
      [`LT : ${formatMetric(properti.luas_tanah) || ""}`, `LB : ${formatMetric(properti.luas_bangunan) || ""}`],
      [`KT : ${hasValue(properti.kamar_tidur) ? properti.kamar_tidur : ""}`, `KM : ${hasValue(properti.kamar_mandi) ? properti.kamar_mandi : ""}`],
    ],
    [
      [bonus, null],
      [properti.sumber_air || null, null],
    ],
    [
      [properti.sertifikat || null, null],
      [properti.kota || null, null],
    ],
  ];

  const featureXs = [150, 440, 730];
  ctx.textAlign = "left";
  features.forEach((column, columnIndex) => {
    column.forEach(([primary, secondary], rowIndex) => {
      const firstLine = String(primary || "").replace(/^(LT|LB|KT|KM) :\s*$/, "");
      const secondLine = String(secondary || "").replace(/^(LT|LB|KT|KM) :\s*$/, "");
      drawFeature(ctx, featureXs[columnIndex], 1220 + rowIndex * 88, firstLine || null, secondLine || null);
    });
  });

  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(130, 1428);
  ctx.lineTo(950, 1428);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "700 29px Arial, Helvetica, sans-serif";
  ctx.fillText("Contact Us For Free Consultation", WIDTH / 2, 1518);

  const contact = [actor.nama, actor.no_hp].filter(hasValue).join(" • ");
  if (contact) {
    ctx.font = "500 27px Arial, Helvetica, sans-serif";
    ctx.fillText(fitText(ctx, `Marketing: ${contact}`, 860), WIDTH / 2, 1572);
  }

  ctx.font = "400 28px Arial, Helvetica, sans-serif";
  ctx.fillText("Instagram : @philip.estate", WIDTH / 2, 1624);
  drawBrandLogo(ctx, 350, 1680, 380, 120);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Gagal membuat file flyer"))), "image/png", 1);
  });
}

export function downloadFlyer(blob, nama = "flyer-properti.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nama;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
