const { Keypair, Connection } = require("@solana/web3.js");

const secret = "[159,234,215,44,188,169,156,119,223,127,79,86,245,205,19,40,243,147,121,23,112,183,140,68,65,255,132,47,135,184,235,116,135,136,92,158,118,7,203,239,50,81,22,18,31,130,127,63,95,48,129,214,237,93,128,153,223,81,61,197,130,161,163,40]";
const parsed = JSON.parse(secret);
const keypair = Keypair.fromSecretKey(new Uint8Array(parsed));
const pubkey = keypair.publicKey.toBase58();

console.log("Authority Public Key:", pubkey);

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

connection.getBalance(keypair.publicKey).then(balance => {
  console.log("Balance (in lamports):", balance);
  console.log("Balance (in SOL):", balance / 10**9);
}).catch(err => {
  console.error("Error fetching balance:", err);
});
