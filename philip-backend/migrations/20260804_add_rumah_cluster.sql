-- Menambahkan kategori khusus Rumah Cluster.
-- Perubahan ini mempertahankan seluruh data kategori yang sudah ada.
ALTER TABLE tipe_properti
  MODIFY COLUMN kategori ENUM(
    'rumah',
    'rumah_cluster',
    'ruko',
    'tanah',
    'gudang',
    'villa',
    'kios',
    'dll'
  ) NOT NULL;
