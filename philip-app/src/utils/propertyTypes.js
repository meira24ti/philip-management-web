export const PROPERTY_TYPE_OPTIONS = Object.freeze([
  { value: "rumah", label: "Rumah" },
  { value: "rumah_cluster", label: "Rumah Cluster" },
  { value: "ruko", label: "Ruko" },
  { value: "tanah", label: "Tanah" },
  { value: "gudang", label: "Gudang" },
  { value: "villa", label: "Villa" },
  { value: "rumah_subsidi", label: "Rumah Subsidi" },
  { value: "kios", label: "Kios" },
  { value: "kombinasi", label: "Kombinasi" },
]);

const TYPE_LABELS = Object.freeze(
  Object.fromEntries(PROPERTY_TYPE_OPTIONS.map(({ value, label }) => [value, label]))
);

const TYPE_ALIASES = Object.freeze({
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

const CLUSTER_PREFIX = /^\s*cluster(?:\s*[-|:]\s*)?/i;

export const normalizePropertyType = (value) =>
  TYPE_ALIASES[String(value || "").trim().toLowerCase()] || "";

export const isRumahCluster = (kategori, subkategori = "") =>
  normalizePropertyType(kategori) === "rumah_cluster" ||
  (normalizePropertyType(kategori) === "rumah" && CLUSTER_PREFIX.test(String(subkategori || "")));

export const getPropertyTypeLabel = (kategori, subkategori = "") => {
  if (isRumahCluster(kategori, subkategori)) return TYPE_LABELS.rumah_cluster;
  return TYPE_LABELS[normalizePropertyType(kategori)] || kategori || "-";
};

export const getPropertySubtypeLabel = (subkategori = "") =>
  String(subkategori || "").replace(CLUSTER_PREFIX, "").trim();
