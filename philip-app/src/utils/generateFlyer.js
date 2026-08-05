import { getImageUrl } from "./imageUrl";

const WIDTH = 1080;
const HEIGHT = 1920;
const MAROON = "#870014";
const DEEP_MAROON = "#5e0010";
const CREAM = "#fffaf6";

const categoryLabel = (value, subcategory = "") => {
  if (String(value || "").trim().toLowerCase() === "rumah" && /^cluster(?:\s*[-|:]\s*)?/i.test(String(subcategory || ""))) {
    return "RUMAH CLUSTER";
  }
  const labels = {
    rumah: "RUMAH",
    rumah_cluster: "RUMAH CLUSTER",
    "rumah cluster": "RUMAH CLUSTER",
    rumah_subsidi: "RUMAH SUBSIDI",
    "rumah subsidi": "RUMAH SUBSIDI",
    ruko: "RUKO",
    tanah: "TANAH",
    gudang: "GUDANG",
    villa: "VILLA",
    apartemen: "APARTEMEN",
    kombinasi: "KOMBINASI",
  };
  return labels[String(value || "").trim().toLowerCase()] || String(value || "PROPERTI").toUpperCase();
};

const offerLabel = (value) => ({
  dijual: "DIJUAL",
  disewa: "DISEWAKAN",
  dijual_dan_disewa: "DIJUAL & DISEWAKAN",
}[value] || "DIJUAL");

const formatPrice = (value, suffix = "") => value
  ? "Rp." + Number(value).toLocaleString("id-ID") + suffix
  : null;

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
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#b78a78");
    gradient.addColorStop(1, "#493632");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "700 28px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FOTO PROPERTI", x + width / 2, y + height / 2);
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
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x - 2, y + 7);
  ctx.lineTo(x + 10, y - 8);
  ctx.stroke();
}

function fitText(ctx, text, maxWidth) {
  let value = String(text || "-");
  while (value.length > 1 && ctx.measureText(value).width > maxWidth) value = value.slice(0, -2) + "...";
  return value;
}

async function loadImage(url) {
  if (!url) return null;
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
    .map((photo) => getImageUrl(photo.url_foto || photo))
    .filter(Boolean);
  const images = await Promise.all(photos.slice(0, 4).map(loadImage));

  const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, "#a7001b");
  background.addColorStop(0.4, MAROON);
  background.addColorStop(1, DEEP_MAROON);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath();
  ctx.arc(WIDTH + 100, 100, 420, 0, Math.PI * 2);
  ctx.fill();

  drawPhoto(ctx, images[0], 30, 30, WIDTH - 60, 665, 18);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(30, 540, WIDTH - 60, 155);
  const thumbnailY = 605;
  const thumbnailW = 280;
  const thumbnailH = 190;
  [1, 2, 3].forEach((index) => {
    const x = 70 + (index - 1) * 320;
    ctx.fillStyle = CREAM;
    ctx.fillRect(x - 5, thumbnailY - 5, thumbnailW + 10, thumbnailH + 10);
    drawPhoto(ctx, images[index] || images[0], x, thumbnailY, thumbnailW, thumbnailH, 2);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "500 51px Arial, Helvetica, sans-serif";
  ctx.fillText(offerLabel(properti.jenis_penawaran) + " " + categoryLabel(properti.kategori, properti.subkategori), WIDTH / 2, 905);
  ctx.font = "400 39px Arial, Helvetica, sans-serif";
  ctx.fillText(fitText(ctx, properti.nama_jalan || properti.kota, 890), WIDTH / 2, 980);

  const salePrice = formatPrice(properti.harga_jual);
  const rentPrice = formatPrice(properti.harga_sewa, "/thn");
  ctx.font = "400 35px Arial, Helvetica, sans-serif";
  let priceY = 1060;
  if (salePrice) {
    ctx.fillText("Harga Jual " + salePrice, WIDTH / 2, priceY);
    priceY += 58;
  }
  if (rentPrice) ctx.fillText("Harga Sewa " + rentPrice, WIDTH / 2, priceY);
  if (!salePrice && !rentPrice) ctx.fillText("Hubungi kami untuk informasi harga", WIDTH / 2, priceY);

  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(130, 1170);
  ctx.lineTo(950, 1170);
  ctx.stroke();

  const specs = [
    ["LT : " + (properti.luas_tanah || "-") + " m2", "LB : " + (properti.luas_bangunan || "-") + " m2"],
    ["KT : " + (properti.kamar_tidur || "-"), "KM : " + (properti.kamar_mandi || "-")],
    [properti.sertifikat || "Sertifikat tersedia", properti.sumber_air || "Air tersedia"],
    [properti.daftar_bonus ? String(properti.daftar_bonus).split(",")[0].trim() : "Kondisi siap huni", properti.kota || "Pekanbaru"],
    [properti.status_unit ? "Status: " + String(properti.status_unit).toUpperCase() : "Unit tersedia", properti.subkategori || "Philip Real Estate"],
    [properti.no_folder ? "No. " + properti.no_folder : "Konsultasi gratis", "Survei sesuai jadwal"],
  ];
  ctx.textAlign = "left";
  ctx.fillStyle = CREAM;
  ctx.font = "500 26px Arial, Helvetica, sans-serif";
  specs.forEach((pair, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 155 + column * 285;
    const y = 1230 + row * 85;
    drawCheck(ctx, x - 35, y - 8);
    ctx.fillText(fitText(ctx, pair[0], 225), x, y);
    ctx.font = "400 23px Arial, Helvetica, sans-serif";
    ctx.fillText(fitText(ctx, pair[1], 225), x, y + 28);
    ctx.font = "500 26px Arial, Helvetica, sans-serif";
  });

  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(130, 1435);
  ctx.lineTo(950, 1435);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = CREAM;
  ctx.font = "700 29px Arial, Helvetica, sans-serif";
  ctx.fillText("Hubungi kami untuk konsultasi gratis", WIDTH / 2, 1530);
  ctx.font = "400 28px Arial, Helvetica, sans-serif";
  const contact = properti.listed_by_nama
    ? "Marketing: " + properti.listed_by_nama + (properti.listed_by_hp ? " - " + properti.listed_by_hp : "")
    : "Philip Real Estate";
  ctx.fillText(fitText(ctx, contact, 860), WIDTH / 2, 1580);

  ctx.fillStyle = CREAM;
  roundedRect(ctx, 370, 1645, 340, 125, 4);
  ctx.fill();
  ctx.fillStyle = MAROON;
  ctx.font = "700 92px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("P", 402, 1740);
  ctx.font = "700 18px Arial, Helvetica, sans-serif";
  ctx.fillText("PHILIP REAL ESTATE", 500, 1694);
  ctx.font = "500 14px Arial, Helvetica, sans-serif";
  ctx.fillText("JUAL | BELI | SEWA | KPR", 500, 1723);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "400 18px Arial, Helvetica, sans-serif";
  ctx.fillText("PEKANBARU, RIAU", WIDTH / 2, 1840);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Gagal membuat file flyer")), "image/png", 1);
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
