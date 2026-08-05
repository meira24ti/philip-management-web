const {
  PROPERTY_CATEGORIES,
} = require("../utils/propertyCategories");

const MIGRATION_ID = "20260804_add_rumah_cluster";

const enumValues = (columnType) => {
  const match = String(columnType || "").match(/^enum\((.*)\)$/i);
  if (!match) return null;

  return Array.from(match[1].matchAll(/'((?:''|[^'])*)'/g), (item) =>
    item[1].replace(/''/g, "'")
  );
};

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

async function up(conn) {
  const [columns] = await conn.query("SHOW COLUMNS FROM tipe_properti LIKE 'kategori'");
  if (!columns.length) {
    throw new Error("Kolom tipe_properti.kategori tidak ditemukan");
  }

  const currentValues = enumValues(columns[0].Type);
  if (!currentValues) {
    throw new Error(
      "Kolom tipe_properti.kategori harus berupa ENUM sebelum migrasi kategori properti dijalankan"
    );
  }

  // Keep any historical enum value so this migration never truncates existing data,
  // while ensuring every option exposed by the application can be persisted.
  const targetValues = [...new Set([...currentValues, ...PROPERTY_CATEGORIES])];
  if (targetValues.join("|") !== currentValues.join("|")) {
    await conn.query(
      `ALTER TABLE tipe_properti MODIFY COLUMN kategori ENUM(${targetValues
        .map(sqlString)
        .join(", ")}) NOT NULL`
    );
  }

  // Normalize historical labels that may have been stored while kategori was a
  // free-text column or before the UI used stable API values.
  await conn.query(`
    UPDATE tipe_properti
    SET kategori = CASE LOWER(TRIM(kategori))
      WHEN 'rumah cluster' THEN 'rumah_cluster'
      WHEN 'rumah-cluster' THEN 'rumah_cluster'
      WHEN 'rumah subsidi' THEN 'rumah_subsidi'
      WHEN 'rumah-subsidi' THEN 'rumah_subsidi'
      ELSE kategori
    END
    WHERE LOWER(TRIM(kategori)) IN ('rumah cluster', 'rumah-cluster', 'rumah subsidi', 'rumah-subsidi')
  `);

  // Before Rumah Cluster became its own category, it was conventionally saved as
  // Rumah with a "Cluster - ..." subcategory. Preserve the actual subtype while
  // moving the record to the canonical category.
  await conn.query(`
    UPDATE tipe_properti
    SET kategori = 'rumah_cluster',
        subkategori = TRIM(REGEXP_REPLACE(
          COALESCE(subkategori, ''),
          '^[[:space:]]*[Cc][Ll][Uu][Ss][Tt][Ee][Rr]([[:space:]]*[-|:])?[[:space:]]*',
          ''
        ))
    WHERE kategori = 'rumah'
      AND LOWER(TRIM(COALESCE(subkategori, ''))) REGEXP '^cluster([[:space:]]*[-|:])?'
  `);
}

module.exports = { id: MIGRATION_ID, up };
