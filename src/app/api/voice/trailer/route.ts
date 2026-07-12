import { NextResponse } from "next/server";
import { querySnowflake, initializeTables } from "@/lib/snowflake";
import { generateTrailerScript } from "@/lib/gemini";
import { textToSpeech } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  console.log("POST /api/voice/trailer - request received");
  try {
    const body = await request.json();
    const { walletAddress, milestoneName } = body;

    if (!walletAddress || !milestoneName) {
      return NextResponse.json(
        { error: "Missing required parameters: walletAddress, milestoneName" },
        { status: 400 }
      );
    }

    // Ensure database tables exist
    await initializeTables();

    // 1. Fetch user's practice logs from Snowflake
    console.log(`Fetching history logs for trailer: ${walletAddress}`);
    let history: any[] = [];
    try {
      history = await querySnowflake(
        `SELECT timestamp, content, title FROM SESSIONS WHERE wallet_address = ? ORDER BY timestamp ASC LIMIT 10`,
        [walletAddress]
      );
    } catch (e) {
      console.warn("Could not retrieve sessions from Snowflake for trailer script, running default prompts:", e);
    }

    // 2. Generate epic trailer script with Google Gemini
    console.log("Calling Gemini for trailer script...");
    const scriptText = await generateTrailerScript(walletAddress, milestoneName, history);
    console.log(`Generated script: "${scriptText}"`);

    // 3. Synthesize voice with ElevenLabs using the configured voice to avoid free-tier limitations
    const deepNarratorVoiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    console.log("Calling ElevenLabs for narrator speech synthesis...");
    const audioUrl = await textToSpeech(scriptText, deepNarratorVoiceId);

    return NextResponse.json({
      success: true,
      script: scriptText,
      audioUrl: audioUrl || "" // Base64 audio URI
    });

  } catch (error: any) {
    console.error("POST /api/voice/trailer failed:", error);
    return NextResponse.json(
      { error: error.message || "Cinematic trailer generation failed" },
      { status: 500 }
    );
  }
}
