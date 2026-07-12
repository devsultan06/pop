import { NextResponse } from "next/server";
import { querySnowflake } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: walletAddress" },
        { status: 400 }
      );
    }

    console.log(`POST /api/clear - deleting all records for wallet: ${walletAddress}`);

    // Delete all sessions for the wallet
    await querySnowflake(
      `DELETE FROM SESSIONS WHERE wallet_address = ?`,
      [walletAddress]
    );

    // Delete all milestones for the wallet
    await querySnowflake(
      `DELETE FROM MILESTONES WHERE wallet_address = ?`,
      [walletAddress]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("clear API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
