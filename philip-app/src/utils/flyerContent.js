import { getPropertyTypeLabel } from "./propertyTypes.js";

export const hasFlyerValue = value => value !== null && value !== undefined && String(value).trim() !== "" && !/^[-–—]+$/.test(String(value).trim());

export function getFlyerFeatures(property) {
  const metric = value => hasFlyerValue(value) ? `${Number(value).toLocaleString("id-ID")} m²` : "Info menyusul";
  const features = [[`LT: ${metric(property.luas_tanah)}`, `LB: ${metric(property.luas_bangunan)}`]];
  const rooms = [hasFlyerValue(property.kamar_tidur) && `KT: ${property.kamar_tidur}`, hasFlyerValue(property.kamar_mandi) && `KM: ${property.kamar_mandi}`].filter(Boolean);
  const bonus = String(property.daftar_bonus || "").split(/[,\n]/).map(value => value.trim()).find(hasFlyerValue);
  const candidates = [rooms, [bonus], [property.sumber_air], [property.sertifikat], [property.kota],
    [hasFlyerValue(property.daya_listrik) && `Listrik: ${property.daya_listrik}`], [property.keamanan], [property.area_kecamatan],
    [getPropertyTypeLabel(property.kategori, property.subkategori, property.kategori_kombinasi_1, property.kategori_kombinasi_2)],
    [({ dijual: "Penawaran jual", disewa: "Penawaran sewa", dijual_dan_disewa: "Jual dan sewa" })[property.jenis_penawaran]],
    ["Detail fasilitas", "Hubungi kami"], ["Jadwal survei", "Hubungi kami"], ["Informasi properti", "Hubungi kami"],
    ["Informasi harga", "Hubungi kami"],
    ["Ketersediaan unit", "Hubungi kami"],
  ];
  for (const lines of candidates) {
    const valid = lines.filter(value => value !== false && hasFlyerValue(value)).map(value => String(value).trim());
    if (valid.length) features.push(valid);
    if (features.length === 6) break;
  }
  return features;
}

// Break exceptionally long words too, so addresses never lose their final characters.
export function wrapCanvasText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || "").split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      for (const character of word) {
        if (line && ctx.measureText(line + character).width > maxWidth) { lines.push(line); line = ""; }
        line += character;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}
