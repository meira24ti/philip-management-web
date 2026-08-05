-- Versi manual untuk database lama. Untuk deployment aplikasi gunakan
-- `npm run migrate`; runner JavaScript bersifat idempoten dan juga menjaga
-- nilai ENUM historis yang mungkin sudah ada.
--
-- Jalankan ALTER ini terlebih dahulu, baru UPDATE di bawahnya.
ALTER TABLE tipe_properti
  MODIFY COLUMN kategori ENUM(
    'rumah',
    'rumah_cluster',
    'ruko',
    'tanah',
    'gudang',
    'villa',
    'rumah_subsidi',
    'kios',
    'kombinasi'
  ) NOT NULL;

-- Backfill format lama: kategori Rumah + subkategori "Cluster - ...".
-- Hanya awalan Cluster yang dihapus; subkategori lain tidak disentuh.
UPDATE tipe_properti
SET kategori = 'rumah_cluster',
    subkategori = TRIM(REGEXP_REPLACE(
      COALESCE(subkategori, ''),
      '^[[:space:]]*[Cc][Ll][Uu][Ss][Tt][Ee][Rr]([[:space:]]*[-|:])?[[:space:]]*',
      ''
    ))
WHERE kategori = 'rumah'
  AND LOWER(TRIM(COALESCE(subkategori, ''))) REGEXP '^cluster([[:space:]]*[-|:])?';
