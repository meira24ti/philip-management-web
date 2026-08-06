const PROPERTY_CATEGORIES = Object.freeze([
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

const PROPERTY_CATEGORY_LABELS = Object.freeze({
  rumah: "Rumah",
  rumah_cluster: "Rumah Cluster",
  ruko: "Ruko",
  tanah: "Tanah",
  gudang: "Gudang",
  villa: "Villa",
  rumah_subsidi: "Rumah Subsidi",
  kios: "Kios",
  kombinasi: "Kombinasi",
});

const CATEGORY_ALIASES = Object.freeze({
  rumah: "rumah",
  "rumah cluster": "rumah_cluster",
  "rumah-cluster": "rumah_cluster",
  rumah_cluster: "rumah_cluster",
  ruko: "ruko",
  tanah: "tanah",
  gudang: "gudang",
  villa: "villa",
  "rumah subsidi": "rumah_subsidi",
  "rumah-subsidi": "rumah_subsidi",
  rumah_subsidi: "rumah_subsidi",
  kios: "kios",
  kombinasi: "kombinasi",
});

// "Cluster" used to be stored in the subtype of a Rumah record.  Require a
// separator, whitespace, or the end of the value so an unrelated subtype such
// as "Clustered" is never silently reclassified as Rumah Cluster.
const CLUSTER_PREFIX = /^\s*cluster(?=$|\s|[-|:])(?:\s*[-|:]\s*|\s+)?/i;

const normalizeKategori = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return CATEGORY_ALIASES[key] || null;
};

const isLegacyRumahCluster = (kategori, subkategori = "") =>
  normalizeKategori(kategori) === "rumah" && CLUSTER_PREFIX.test(String(subkategori || ""));

const isRumahCluster = (kategori, subkategori = "") =>
  normalizeKategori(kategori) === "rumah_cluster" || isLegacyRumahCluster(kategori, subkategori);

const cleanClusterSubkategori = (subkategori = "") =>
  String(subkategori || "").replace(CLUSTER_PREFIX, "").trim();

const kategoriLabel = (kategori, subkategori = "") => {
  if (isRumahCluster(kategori, subkategori)) return PROPERTY_CATEGORY_LABELS.rumah_cluster;
  return PROPERTY_CATEGORY_LABELS[normalizeKategori(kategori)] || String(kategori || "Properti");
};

module.exports = {
  PROPERTY_CATEGORIES,
  PROPERTY_CATEGORY_LABELS,
  normalizeKategori,
  isLegacyRumahCluster,
  isRumahCluster,
  cleanClusterSubkategori,
  kategoriLabel,
};
