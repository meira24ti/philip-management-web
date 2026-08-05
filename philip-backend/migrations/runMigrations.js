const pool = require("../config/db");
const rumahCluster = require("./20260804_add_rumah_cluster");

const migrations = [rumahCluster];

async function runMigrations(db = pool) {
  const conn = await db.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [appliedRows] = await conn.query("SELECT id FROM schema_migrations");
    const applied = new Set(appliedRows.map((row) => row.id));

    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;

      await migration.up(conn);
      await conn.query("INSERT INTO schema_migrations (id) VALUES (?)", [migration.id]);
      console.log(`Migrasi database diterapkan: ${migration.id}`);
    }
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migrasi database selesai.");
      pool.end();
    })
    .catch((error) => {
      console.error("Migrasi database gagal:", error.message);
      pool.end();
      process.exitCode = 1;
    });
}

module.exports = { runMigrations };
