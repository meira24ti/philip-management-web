module.exports = {
  id: '20261016_align_form_columns',
  async up(db) {
    // Optional form values must remain NULL, including land-only listings.
    // These operations are repeatable if startup is interrupted mid-migration.
    await db.query('ALTER TABLE properti MODIFY area_kecamatan VARCHAR(100) NULL, MODIFY luas_bangunan DECIMAL(10,2) NULL, MODIFY sertifikat VARCHAR(100) NULL');
    await db.query('ALTER TABLE user MODIFY email VARCHAR(254) NOT NULL, MODIFY no_hp VARCHAR(30) NULL');
    await db.query('ALTER TABLE vendor MODIFY no_hp VARCHAR(30) NULL');
    await db.query('ALTER TABLE laporan MODIFY judul VARCHAR(255) NOT NULL');
  },
};
