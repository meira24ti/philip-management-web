const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PROPERTY_CATEGORIES,
  normalizeKategori,
  isRumahCluster,
  cleanClusterSubkategori,
  kategoriLabel,
} = require("../utils/propertyCategories");

test("normalizes UI labels and API values to the same property category", () => {
  assert.equal(normalizeKategori("Rumah Cluster"), "rumah_cluster");
  assert.equal(normalizeKategori("rumah_cluster"), "rumah_cluster");
  assert.equal(normalizeKategori("Rumah Subsidi"), "rumah_subsidi");
  assert.deepEqual(PROPERTY_CATEGORIES, [
    "rumah",
    "rumah_cluster",
    "ruko",
    "tanah",
    "gudang",
    "villa",
    "rumah_subsidi",
    "kios",
    "kombinasi",
  ]);
});

test("recognizes and cleans only the legacy Cluster prefix", () => {
  assert.equal(isRumahCluster("rumah", "Cluster - Mewah"), true);
  assert.equal(cleanClusterSubkategori("Cluster - Mewah"), "Mewah");
  assert.equal(cleanClusterSubkategori("Mewah"), "Mewah");
  assert.equal(isRumahCluster("rumah", "Clustered residence"), false);
  assert.equal(cleanClusterSubkategori("Clustered residence"), "Clustered residence");
});

test("returns human-readable labels for persisted categories", () => {
  assert.equal(kategoriLabel("rumah_cluster"), "Rumah Cluster");
  assert.equal(kategoriLabel("rumah_subsidi"), "Rumah Subsidi");
  assert.equal(kategoriLabel("kios"), "Kios");
});
