const MIGRATION_ID = "20260807_make_luas_tanah_optional";

async function up(conn) {
  const [columns] = await conn.query("SHOW COLUMNS FROM properti WHERE Field = 'luas_tanah'");
  if (!columns.length) {
    throw new Error("Kolom properti.luas_tanah tidak ditemukan");
  }

  const column = columns[0];
  if (column.Null === "YES" && column.Default === null) return;

  await conn.query(
    `ALTER TABLE properti MODIFY COLUMN luas_tanah ${column.Type} NULL DEFAULT NULL`
  );
}

module.exports = { id: MIGRATION_ID, up };
