import { NextResponse } from "next/server";
import { verifyWalletSignature } from "@/lib/solana";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required parameters: walletAddress, signature, message" },
        { status: 400 }
      );
    }

    const verified = verifyWalletSignature(walletAddress, message, signature);

    if (!verified) {
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("verify-wallet API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
