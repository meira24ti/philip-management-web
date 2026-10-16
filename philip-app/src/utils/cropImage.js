export function getSquareCrop(width, height, zoom = 1, x = 0.5, y = 0.5) {
  const size = Math.min(width, height) / Math.max(1, Math.min(zoom, 4));
  return {
    x: (width - size) * Math.max(0, Math.min(x, 1)),
    y: (height - size) * Math.max(0, Math.min(y, 1)),
    size,
  };
}

export function cropImageFile(image, crop, filename, { maxSize = 1600 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.max(1, Math.min(maxSize, Math.round(crop.size)));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (!blob) return reject(new Error("Gagal memotong foto"));
    resolve(new File([blob], `${filename.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" }));
  }, "image/jpeg", 0.94));
}
