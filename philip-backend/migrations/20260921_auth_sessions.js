async function up(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
    id_session CHAR(36) NOT NULL PRIMARY KEY,
    id_user VARCHAR(64) NOT NULL,
    password_version CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_sessions_user (id_user),
    INDEX idx_auth_sessions_expiry (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}
module.exports = { id: "20260921_auth_sessions", up };
