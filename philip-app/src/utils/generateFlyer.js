// philip-app/src/utils/generateFlyer.js

const canvasWidth = 840;
const canvasHeight = 480;
const padding = 28;
const imageHeight = 320;
const borderRadius = 24;

function drawRoundedRect(ctx, x, y, width, height, radius) {
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

async function loadImage(url) {
  // Try loading with Image + crossOrigin first; if it fails, try fetching blob as fallback.
  return new Promise(async (resolve, reject) => {
    const tryImage = (src) => new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('img load error'));
      img.src = src;
    });

    try {
      const img = await tryImage(url);
      return resolve(img);
    } catch (e) {
      // fallback: fetch as blob and load from object URL
      try {
        const resp = await fetch(url, { mode: 'cors' });
        if (!resp.ok) throw new Error('fetch failed');
        const blob = await resp.blob();
        const obj = URL.createObjectURL(blob);
        try {
          const img2 = await tryImage(obj);
          URL.revokeObjectURL(obj);
          return resolve(img2);
        } catch (err) {
          URL.revokeObjectURL(obj);
          return reject(new Error('Gagal memuat gambar flyer'));
        }
      } catch (err) {
        return reject(new Error('Gagal memuat gambar flyer'));
      }
    }
  });
}

export async function generateFlyerPNG(properti, options = {}) {
  try {
    const scale = options.scale || 3;
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context tidak tersedia");
    ctx.scale(scale, scale);
    // Improve interpolation quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Background
    ctx.fillStyle = "#1a0000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Card background
    ctx.fillStyle = "#2c0505";
    drawRoundedRect(ctx, padding, padding, canvasWidth - padding * 2, canvasHeight - padding * 2, borderRadius);
    ctx.fill();

    // Header gradient
    const headerHeight = 68;
    const gradient = ctx.createLinearGradient(padding, padding, canvasWidth - padding, padding + headerHeight);
    gradient.addColorStop(0, "#7A0000");
    gradient.addColorStop(1, "#3D0000");
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, padding, padding, canvasWidth - padding * 2, headerHeight, borderRadius);
    ctx.fill();

    // Header text
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 18px Inter, Arial, sans-serif";
    ctx.fillText("PHILIP REAL ESTATE", padding + 18, padding + 28);
    ctx.font = "400 12px Inter, Arial, sans-serif";
    ctx.fillStyle = "#ffaaaa";
    ctx.fillText("PEKANBARU · RIAU", padding + 18, padding + 46);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 12px Inter, Arial, sans-serif";
    const labelText = (properti.jenis_penawaran || "DIJUAL").toUpperCase();
    const labelWidth = ctx.measureText(labelText).width + 22;
    const labelX = canvasWidth - padding - labelWidth - 20;
    const labelY = padding + 20;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    drawRoundedRect(ctx, labelX, labelY, labelWidth, 26, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labelText, labelX + 12, labelY + 17);

    const cover = properti.foto_properti?.find(f => f.is_cover)?.url_foto
      || "https://placehold.co/840x320/7A0000/ffffff?text=Properti";

    let coverImg;
    try {
      coverImg = await loadImage(cover);
    } catch {
      coverImg = await loadImage("https://placehold.co/840x320/7A0000/ffffff?text=Properti");
    }

    const imgX = padding;
    const imgY = padding + headerHeight + 10;
    const imgW = canvasWidth - padding * 2;
    const imgH = imageHeight;
    ctx.save();
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 16);
    ctx.clip();
    ctx.drawImage(coverImg, imgX, imgY, imgW, imgH);
    ctx.restore();

    const boxX = padding + 14;
    const boxY = imgY + imgH + 18;
    const boxW = canvasWidth - padding * 2 - 28;

    const hargaJual = properti.harga_jual
      ? `Rp ${Number(properti.harga_jual).toLocaleString("id-ID")}`
      : null;
    const hargaSewa = properti.harga_sewa
      ? `Rp ${Number(properti.harga_sewa).toLocaleString("id-ID")}/thn`
      : null;
    const hargaText = hargaJual || hargaSewa || "-";

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    drawRoundedRect(ctx, boxX, boxY, boxW, 90, 16);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 10px Inter, Arial, sans-serif";
    ctx.fillText("HARGA", boxX + 14, boxY + 20);
    ctx.font = "700 22px Inter, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(hargaText, boxX + 14, boxY + 45);
    if (hargaJual && hargaSewa) {
      ctx.font = "400 12px Inter, Arial, sans-serif";
      ctx.fillStyle = "#aad4ff";
      ctx.fillText(`Sewa: ${hargaSewa}`, boxX + 14, boxY + 65);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 18px Inter, Arial, sans-serif";
    ctx.fillText(`${properti.kategori || ""} ${properti.subkategori || ""}`.trim(), boxX + 14, boxY + 115);

    ctx.font = "400 12px Inter, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText(`📍 ${properti.nama_jalan || "-"}, ${properti.kota || "-"}`, boxX + 14, boxY + 135);

    const badgeY = boxY + 170;
    let badgeX = boxX + 14;
    const badgeGap = 8;
    const badgeStyles = [
      { value: properti.luas_tanah && `LT ${properti.luas_tanah}m²` },
      { value: properti.luas_bangunan && `LB ${properti.luas_bangunan}m²` },
      { value: properti.kamar_tidur && `🛏 ${properti.kamar_tidur}` },
      { value: properti.kamar_mandi && `🚿 ${properti.kamar_mandi}` },
      { value: properti.sertifikat && `${properti.sertifikat}` },
    ].filter(item => item.value);

    ctx.font = "500 10px Inter, Arial, sans-serif";
    badgeStyles.forEach((badge) => {
      const text = badge.value;
      const width = ctx.measureText(text).width + 16;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      drawRoundedRect(ctx, badgeX, badgeY, width, 24, 12);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.76)";
      ctx.fillText(text, badgeX + 8, badgeY + 16);
      badgeX += width + badgeGap;
    });

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 10px Inter, Arial, sans-serif";
    ctx.fillText(`Marketing: ${properti.listed_by_nama || "-"}`, boxX + 14, boxY + 210);
    ctx.fillText(`No. ${properti.no_folder || "-"}`, boxX + 14, boxY + 228);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal membuat Blob dari canvas"));
      }, "image/png", 1.0);
    });
  } catch (error) {
    console.error("Gagal generate flyer:", error);
    throw error;
  }
}

export function downloadFlyer(blob, nama = "flyer-properti.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nama;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
