const snowflake = require("snowflake-sdk");
const fs = require("fs");

// Manually parse .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
});

const connection = snowflake.createConnection({
  account: env.SNOWFLAKE_ACCOUNT,
  username: env.SNOWFLAKE_USERNAME,
  password: env.SNOWFLAKE_PASSWORD,
  database: env.SNOWFLAKE_DATABASE || "PROOF_OF_PRACTICE",
  schema: env.SNOWFLAKE_SCHEMA || "PUBLIC",
  warehouse: env.SNOWFLAKE_WAREHOUSE,
  role: env.SNOWFLAKE_ROLE
});

connection.connect((err, conn) => {
  if (err) {
    console.error("Connection failed:", err);
    return;
  }
  console.log("Connected to Snowflake.");
  
  conn.execute({
    sqlText: "SELECT DISTINCT wallet_address FROM SESSIONS",
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Query failed:", err);
      } else {
        console.log("Wallets in Snowflake:", rows);
      }
      conn.destroy();
    }
  });
});
