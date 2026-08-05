const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeKategori,
  isRumahCluster,
  cleanClusterSubkategori,
  kategoriLabel,
} = require("../utils/propertyCategories");

test("normalizes UI labels and API values to the same property category", () => {
  assert.equal(normalizeKategori("Rumah Cluster"), "rumah_cluster");
  assert.equal(normalizeKategori("rumah_cluster"), "rumah_cluster");
  assert.equal(normalizeKategori("Rumah Subsidi"), "rumah_subsidi");
});

test("recognizes and cleans only the legacy Cluster prefix", () => {
  assert.equal(isRumahCluster("rumah", "Cluster - Mewah"), true);
  assert.equal(cleanClusterSubkategori("Cluster - Mewah"), "Mewah");
  assert.equal(cleanClusterSubkategori("Mewah"), "Mewah");
});

test("returns human-readable labels for persisted categories", () => {
  assert.equal(kategoriLabel("rumah_cluster"), "Rumah Cluster");
  assert.equal(kategoriLabel("rumah_subsidi"), "Rumah Subsidi");
});
