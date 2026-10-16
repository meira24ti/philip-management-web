const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const { normalizeCombination, kategoriLabel } = require("../utils/propertyCategories");
const { watermarkPropertyPhoto } = require("../utils/propertyImages");

test("combinations require two distinct concrete types and preserve readable labels", () => {
  assert.deepEqual(normalizeCombination("kombinasi", "Rumah Cluster", "Ruko"), { kategori_kombinasi_1: "rumah_cluster", kategori_kombinasi_2: "ruko" });
  assert.equal(kategoriLabel("kombinasi", "", "rumah_cluster", "ruko"), "Rumah Cluster + Ruko");
  for (const pair of [["rumah", "rumah"], ["rumah", ""], ["kombinasi", "rumah"], ["unknown", "tanah"]]) {
    assert.throws(() => normalizeCombination("kombinasi", ...pair), { statusCode: 400 });
  }
  assert.deepEqual(normalizeCombination("tanah", "rumah", "ruko"), { kategori_kombinasi_1: null, kategori_kombinasi_2: null });
});

test("watermark changes the middle of the image without covering corners or changing aspect ratio", async () => {
  for (const [width, height] of [[800, 400], [400, 800], [500, 500]]) {
    const source = await sharp({ create: { width, height, channels: 3, background: "#202020" } }).png().toBuffer();
    const result = await watermarkPropertyPhoto(source);
    const { data, info } = await sharp(result).raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, width); assert.equal(info.height, height);
    assert.ok(Math.abs(data[0] - 32) <= 3);
    let lightPixels = 0;
    for (let y = Math.floor(height * 0.44); y < height * 0.56; y++) {
      for (let x = Math.floor(width * 0.44); x < width * 0.56; x++) {
        if (data[(y * width + x) * info.channels] > 70) lightPixels++;
      }
    }
    assert.ok(lightPixels > 20, "Expected visible translucent company mark in the center");
  }
});

test("corrupt photos are rejected as a user error", async () => {
  await assert.rejects(watermarkPropertyPhoto(Buffer.from("not an image")), { statusCode: 400 });
});

test("crop geometry stays inside portrait and landscape photos at all zoom limits", async () => {
  const { getSquareCrop } = await import("../../philip-app/src/utils/cropImage.js");
  for (const [w, h] of [[1600, 900], [900, 1600], [800, 800]]) {
    for (const zoom of [1, 2, 4]) for (const x of [0, 0.5, 1]) for (const y of [0, 0.5, 1]) {
      const crop = getSquareCrop(w, h, zoom, x, y);
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.size <= w && crop.y + crop.size <= h);
    }
  }
});

test("flyer retains six real or clearly unspecified points, including LT and LB", async () => {
  const { getFlyerFeatures } = await import("../../philip-app/src/utils/flyerContent.js");
  for (const property of [{}, { kategori: "tanah", kota: "Pekanbaru", luas_tanah: 0 }, { daftar_bonus: "-", sumber_air: "—", luas_bangunan: "" }]) {
    const features = getFlyerFeatures(property);
    assert.equal(features.length, 6);
    assert.match(features[0][0], /^LT: /); assert.match(features[0][1], /^LB: /);
    assert.ok(features.flat().every(line => line && !/^[-–—]+$/.test(line)));
  }
  assert.match(getFlyerFeatures({ luas_tanah: 0 })[0][0], /0 m²/);
});

test("address wrapping retains every word and splits long unbroken words", async () => {
  const { wrapCanvasText } = await import("../../philip-app/src/utils/flyerContent.js");
  const ctx = { measureText: text => ({ width: text.length * 10 }) };
  const address = "Jalan Panjang Sekali Perumahan " + "A".repeat(140);
  const lines = wrapCanvasText(ctx, address, 200);
  assert.equal(lines.join("").replace(/\s/g, ""), address.replace(/\s/g, ""));
  assert.ok(lines.every(line => ctx.measureText(line).width <= 200));
});

test("API configuration accepts a domain, API URL, and same-origin proxy without duplicate paths", async () => {
  const { normalizeApiBaseUrl } = await import("../../philip-app/src/utils/apiBaseUrl.js");
  assert.equal(normalizeApiBaseUrl("https://philiprealestate.com"), "https://philiprealestate.com/api");
  assert.equal(normalizeApiBaseUrl("https://philiprealestate.com/api/"), "https://philiprealestate.com/api");
  assert.equal(normalizeApiBaseUrl("/api"), "/api");
});
