async function up(conn) {
  const [folderColumns] = await conn.query("SHOW COLUMNS FROM properti WHERE Field = 'no_folder'");
  if (folderColumns.length && folderColumns[0].Null !== "YES") {
    await conn.query(`ALTER TABLE properti MODIFY COLUMN no_folder ${folderColumns[0].Type} NULL DEFAULT NULL`);
  }
  // NULL allows multiple listings without a folder, including with a UNIQUE index.
  await conn.query("UPDATE properti SET no_folder = NULL WHERE TRIM(no_folder) = ''");
  // Retain historical values while allowing new records to omit the retired field.
  const [feedColumns] = await conn.query("SHOW COLUMNS FROM properti WHERE Field = 'feed'");
  if (feedColumns.length && feedColumns[0].Null === "NO" && feedColumns[0].Default === null) {
    await conn.query(`ALTER TABLE properti MODIFY COLUMN feed ${feedColumns[0].Type} NOT NULL DEFAULT 0`);
  }
  const [typeColumns] = await conn.query("SHOW COLUMNS FROM tipe_properti");
  for (const name of ["kategori_kombinasi_1", "kategori_kombinasi_2"]) {
    if (!typeColumns.some(column => column.Field === name)) {
      await conn.query(`ALTER TABLE tipe_properti ADD COLUMN ${name} VARCHAR(30) NULL DEFAULT NULL`);
    }
  }
  const [photoColumns] = await conn.query("SHOW COLUMNS FROM foto_properti");
  if (!photoColumns.some(column => column.Field === "watermark_version")) {
    await conn.query("ALTER TABLE foto_properti ADD COLUMN watermark_version TINYINT UNSIGNED NOT NULL DEFAULT 0");
  }
}

module.exports = { id: "20260920_property_media_and_types", up };
