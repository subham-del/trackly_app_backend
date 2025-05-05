const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // Use true for Azure
    trustServerCertificate: true, // Set to true for local dev/self-signed certs
  },
};

async function connectToDatabase() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server");
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

module.exports = { sql, connectToDatabase };
