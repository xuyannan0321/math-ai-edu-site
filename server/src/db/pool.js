const mysql = require("mysql2/promise");
const { env } = require("../config/env");

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  connectTimeout: 10000,
  namedPlaceholders: true,
  timezone: "Z",
});

module.exports = pool;
