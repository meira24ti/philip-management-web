const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../config/db");
const controller = require("../controllers/propertiController");

function requestBody() {
  return { tanggal_listing: "2026-09-20", jenis_penawaran: "dijual", harga_jual: "725000000", nama_jalan: "Jl. Bakti",
    kota: "Pekanbaru", listed_by: "marketing-test", status_unit: "tersedia", id_vendor: "vendor-test", kategori: "kombinasi",
    kategori_kombinasi_1: "rumah", kategori_kombinasi_2: "ruko" };
}

test("create accepts an omitted folder and persists both combination types", async t => {
  const writes = [];
  const conn = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {},
    query: async (sql, args) => {
      writes.push({ sql, args });
      if (sql.startsWith("SHOW COLUMNS")) return [[{ Field: "nama_jalan", Type: "varchar(255)" }]];
      return [{ affectedRows: 1 }];
    } };
  t.mock.method(pool, "getConnection", async () => conn);
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await controller.create({ body: requestBody(), files: [], user: { id: "admin-test" } }, response);
  assert.equal(response.code, 201);
  const property = writes.find(write => write.sql === "INSERT INTO properti SET ?").args[0];
  const type = writes.find(write => write.sql === "INSERT INTO tipe_properti SET ?").args[0];
  assert.equal(property.no_folder, null);
  assert.equal(type.kategori_kombinasi_1, "rumah"); assert.equal(type.kategori_kombinasi_2, "ruko");
  assert.ok(!Object.hasOwn(property, "feed"));
});

test("update clears an existing folder and combination fields when changing to a single type", async t => {
  const writes = [];
  const existing = { ...requestBody(), id_properti: "property-test", no_folder: "PRE-001" };
  const conn = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {},
    query: async (sql, args) => {
      writes.push({ sql, args });
      if (sql.startsWith("SELECT * FROM properti")) return [[existing]];
      if (sql.startsWith("SELECT * FROM tipe_properti")) return [[{ ...existing, id_tipeproperti: "type-test", subkategori: "" }]];
      if (sql.startsWith("SHOW COLUMNS")) return [[]];
      return [{ affectedRows: 1 }];
    } };
  t.mock.method(pool, "getConnection", async () => conn);
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await controller.update({ body: { no_folder: "  ", kategori: "tanah", feed: 1 }, files: [], params: { id: "property-test" }, user: { id: "admin-test" } }, response);
  assert.equal(response.code, 200);
  const property = writes.find(write => write.sql.startsWith("UPDATE properti SET ?")).args[0];
  assert.equal(property.no_folder, null); assert.ok(!Object.hasOwn(property, "feed"));
  const type = writes.find(write => write.sql.startsWith("UPDATE tipe_properti SET"));
  assert.deepEqual(type.args.slice(0, 2), [null, null]);
  assert.ok(type.args.includes("tanah"));
});

test("share text uses the combination and contact name without a position prefix", async t => {
  t.mock.method(pool, "query", async () => [[{ ...requestBody(), shared_by_nama: "Ayu", shared_by_hp: "0812345" }]]);
  const response = { json(body) { this.body = body; } };
  await controller.getShareText({ user: { id: "admin-test" }, params: { id: "property-test" } }, response);
  assert.match(response.body.shareText, /RUMAH \+ RUKO/);
  assert.match(response.body.shareText, /Ayu \(0812345\)/);
  assert.doesNotMatch(response.body.shareText, /Marketing:/);
});
