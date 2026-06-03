const mysql = require("mysql2/promise");

const dbHost = process.env.MYSQLHOST || process.env.DB_HOST;
const dbUser = process.env.MYSQLUSER || process.env.DB_USER;
const dbPass = process.env.MYSQLPASSWORD || process.env.DB_PASS;
const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
const dbPort = process.env.MYSQLPORT || process.env.DB_PORT || 3306;

const configuredPassword = dbPass;
const password =
  configuredPassword && configuredPassword !== "your_password"
    ? configuredPassword
    : "";

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
