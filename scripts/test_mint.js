const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require("@solana/web3.js");

const rpcUrl = "https://api.devnet.solana.com";
const secret = "[159,234,215,44,188,169,156,119,223,127,79,86,245,205,19,40,243,147,121,23,112,183,140,68,65,255,132,47,135,184,235,116,135,136,92,158,118,7,203,239,50,81,22,18,31,130,127,63,95,48,129,214,237,93,128,153,223,81,61,197,130,161,163,40]";
const parsed = JSON.parse(secret);
const authorityKeypair = Keypair.fromSecretKey(new Uint8Array(parsed));
const connection = new Connection(rpcUrl, "confirmed");

async function main() {
  console.log("Authority Public Key:", authorityKeypair.publicKey.toBase58());
  const recipientWallet = "AkytLyJnoK55QMp1mMmPVtXMNWB7HK3ZuLWDVu8ruBGp"; // User's wallet
  const milestoneType = "First Step";
  const streakLength = 1;

  try {
    const recipientPubKey = new PublicKey(recipientWallet);
    const memoData = JSON.stringify({
      app: "Proof of Practice",
      milestone: milestoneType,
      streak: streakLength,
      timestamp: new Date().toISOString(),
      recipient: recipientPubKey.toBase58(),
    });

    const memoProgramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
    
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: false }],
      programId: memoProgramId,
      data: Buffer.from(memoData, "utf-8"),
    });

    const transaction = new Transaction().add(memoInstruction);
    transaction.feePayer = authorityKeypair.publicKey;
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    transaction.sign(authorityKeypair);

    console.log("Sending raw transaction...");
    const signature = await connection.sendRawTransaction(transaction.serialize());
    console.log("Transaction sent. Signature:", signature);

    console.log("Confirming transaction...");
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature
    });

    console.log("Transaction successfully confirmed!");
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

main();
