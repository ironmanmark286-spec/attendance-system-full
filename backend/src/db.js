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

const dbConfig = {
  host: dbHost,
  user: dbUser,
  password,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10
};

// Add SSL for providers like Aiven that require it
if (dbHost && dbHost.includes("aivencloud.com")) {
  dbConfig.ssl = {
    rejectUnauthorized: false // Required for Aiven if custom CA is not provided
  };
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
