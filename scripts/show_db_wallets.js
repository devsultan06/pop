const { querySnowflake } = require("../src/lib/snowflake");

async function main() {
  try {
    const rows = await querySnowflake("SELECT DISTINCT wallet_address FROM SESSIONS");
    console.log("Connected wallets in DB:", rows);
  } catch (e) {
    console.error("Failed to query DB:", e);
  }
}

main();
