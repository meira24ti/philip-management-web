require("dotenv").config();
const pool = require("./config/db");
const { runMigrations } = require("./migrations/runMigrations");
const { createApp } = require("./app");

async function startServer() {
  try {
    const app = createApp();
    await runMigrations(pool);
    const server = app.listen(process.env.PORT || 5000, () => console.log("Philip API siap menerima request"));
    server.requestTimeout = 120000;
    server.headersTimeout = 15000;
    const stop = () => server.close(() => pool.end());
    process.once("SIGTERM", stop);
    process.once("SIGINT", stop);
  } catch (error) {
    console.error("Server gagal dimulai:", error.message);
    await pool.end();
    process.exitCode = 1;
  }
}
if (require.main === module) void startServer();
module.exports = { startServer };
