const mysql = require("mysql2/promise");

const configuredPassword = process.env.DB_PASS;
const password =
  configuredPassword && configuredPassword !== "your_password"
    ? configuredPassword
    : "";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
