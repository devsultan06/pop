import { NextResponse } from "next/server";
import { querySnowflake, initializeTables } from "@/lib/snowflake";
import { analyzePracticeSession } from "@/lib/gemini";
import { textToSpeech } from "@/lib/elevenlabs";

// Simple in-memory rate limiting Map
// Key: walletAddress, Value: timestamp of last log
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 6000; // 6 seconds limit

export async function POST(request: Request) {
  console.log("POST /api/log - request received");
  try {
    const body = await request.json();
    const { walletAddress, type, content, title, duration, instrument, customVoiceId } = body;

    // 1. Validation
    if (!walletAddress || !type || !content) {
      console.log("POST /api/log - validation failed: missing params");
      return NextResponse.json(
        { error: "Missing required parameters: walletAddress, type, content" },
        { status: 400 }
      );
    }

    // 2. Rate Limiting check
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(walletAddress);
    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
      console.log(`POST /api/log - rate limit hit for ${walletAddress}`);
      return NextResponse.json(
        { error: "Too many requests. Please wait a few seconds before logging another practice." },
        { status: 429 }
      );
    }
    rateLimitMap.set(walletAddress, now);

    // Ensure database tables exist
    await initializeTables();

    // 3. Retrieve recent history from Snowflake (last 5 sessions)
    console.log(`Retrieving Snowflake history for wallet: ${walletAddress}`);
    let history: any[] = [];
    try {
      history = await querySnowflake(
        `SELECT timestamp, content, feedback_text FROM SESSIONS WHERE wallet_address = ? ORDER BY timestamp DESC LIMIT 5`,
        [walletAddress]
      );
    } catch (e) {
      console.error("Snowflake history fetch error, continuing without history context:", e);
    }

    // 4. Query Gemini for feedback analysis
    console.log("Calling Gemini analysis...");
    const analysis = await analyzePracticeSession(content, history, instrument || "general");
    console.log("Gemini analysis completed:", analysis);

    // 5. Query ElevenLabs for voice synthesis
    console.log(`Calling ElevenLabs speech synthesis (customVoiceId: ${customVoiceId || 'none'})...`);
    const audioBase64 = await textToSpeech(analysis.feedbackText, customVoiceId);

    // 6. Record session in Snowflake
    const sessionId = `session-${Date.now()}`;
    const timestampStr = new Date().toISOString();
    const sessionTitle = title || (type === "voice" ? "Voice Reflection" : "Text Reflection");
    const sessionDuration = duration || (type === "voice" ? 45 : 60);

    console.log(`Inserting practice session record into Snowflake: ${sessionId}`);
    try {
      await querySnowflake(
        `INSERT INTO SESSIONS (id, wallet_address, timestamp, type, title, content, feedback_text, sentiment, duration) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          walletAddress,
          timestampStr,
          type,
          sessionTitle,
          content,
          analysis.feedbackText,
          analysis.sentiment,
          sessionDuration
        ]
      );
    } catch (e) {
      console.error("Failed to insert session row into Snowflake:", e);
    }

    // 7. Calculate current streak dynamically to return to the client
    let currentStreak = 0;
    try {
      const allTimestamps = await querySnowflake(
        `SELECT timestamp FROM SESSIONS WHERE wallet_address = ? ORDER BY timestamp DESC`,
        [walletAddress]
      );
      currentStreak = calculateStreak(allTimestamps.map((t) => t.TIMESTAMP || t.timestamp));
    } catch (e) {
      console.error("Failed to compute current streak for response, returning 0:", e);
    }

    console.log(`Session logged successfully. Wallet: ${walletAddress}, Streak: ${currentStreak}`);
    return NextResponse.json({
      success: true,
      sessionId,
      feedbackText: analysis.feedbackText,
      audioUrl: audioBase64, // base64 string or null
      sentiment: analysis.sentiment,
      specificNote: analysis.specificNote,
      currentStreak
    });

  } catch (error: any) {
    console.error("log API route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: compute current streak from timestamp list
function calculateStreak(timestamps: string[]): number {
  if (!timestamps || timestamps.length === 0) return 0;

  // Convert to local YYYY-MM-DD unique sorted descending dates
  const uniqueDates = Array.from(
    new Set(
      timestamps.map((t) => {
        const d = new Date(t);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      })
    )
  ).map((dStr) => new Date(dStr + "T12:00:00"));

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const latestPractice = uniqueDates[0];
  const hasPracticeToday = isSameDay(latestPractice, today);
  const hasPracticeYesterday = isSameDay(latestPractice, yesterday);

  if (!hasPracticeToday && !hasPracticeYesterday) {
    return 0;
  }

  let streak = 1;
  let checkDate = new Date(latestPractice);

  for (let i = 1; i < uniqueDates.length; i++) {
    const expectedPrevDate = new Date(checkDate);
    expectedPrevDate.setDate(checkDate.getDate() - 1);

    if (isSameDay(uniqueDates[i], expectedPrevDate)) {
      streak++;
      checkDate = uniqueDates[i];
    } else {
      break;
    }
  }

  return streak;
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}
