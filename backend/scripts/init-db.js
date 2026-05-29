const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const sqlPath = path.join(__dirname, "..", "src", "sql", "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
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
