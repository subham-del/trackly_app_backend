const sql = require("mssql");

const config = {
  user: "subhamsql",
  password: "subham123",
  server: "192.168.1.2",
  database: "TracklyDB",
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
