const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const sqlPath = path.join(__dirname, "..", "src", "sql", "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const dbHost = process.env.MYSQLHOST || process.env.DB_HOST;
  const dbUser = process.env.MYSQLUSER || process.env.DB_USER;
  const dbPass = process.env.MYSQLPASSWORD || process.env.DB_PASS;
  const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
  const dbPort = process.env.MYSQLPORT || process.env.DB_PORT || 3306;

  const connection = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    port: dbPort,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();
  console.log("Database initialized successfully.");
}

main().catch((err) => {
  console.error("Database initialization failed:", err.message || "(no message)");
  if (err.code) console.error("Error code:", err.code);
  if (err.errno) console.error("Errno:", err.errno);
  if (err.sqlMessage) console.error("SQL message:", err.sqlMessage);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
