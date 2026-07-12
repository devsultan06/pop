import { NextResponse } from "next/server";
import { querySnowflake } from "@/lib/snowflake";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "Missing 'wallet' query parameter" }, { status: 400 });
    }

    console.log(`GET /api/streak - calculating streaks for: ${wallet}`);

    // Query Snowflake for all sessions timestamps
    const rows = await querySnowflake(
      `SELECT timestamp FROM SESSIONS WHERE wallet_address = ? ORDER BY timestamp DESC`,
      [wallet]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
      });
    }

    const timestamps = rows.map((r) => r.TIMESTAMP || r.timestamp);
    const lastLogDate = timestamps[0];

    // Format unique sorted descending dates
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

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const latestPractice = uniqueDates[0];
    const hasPracticeToday = isSameDay(latestPractice, today);
    const hasPracticeYesterday = isSameDay(latestPractice, yesterday);

    let currentStreak = 0;
    if (hasPracticeToday || hasPracticeYesterday) {
      currentStreak = 1;
      let checkDate = new Date(latestPractice);
      for (let i = 1; i < uniqueDates.length; i++) {
        const expectedPrev = new Date(checkDate);
        expectedPrev.setDate(checkDate.getDate() - 1);
        if (isSameDay(uniqueDates[i], expectedPrev)) {
          currentStreak++;
          checkDate = uniqueDates[i];
        } else {
          break;
        }
      }
    }

    // Longest Streak calculation
    let longestStreak = 0;
    if (uniqueDates.length > 0) {
      longestStreak = 1;
      let currentChain = 1;
      let checkDate = uniqueDates[0];
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const expectedPrev = new Date(checkDate);
        expectedPrev.setDate(checkDate.getDate() - 1);
        if (isSameDay(uniqueDates[i], expectedPrev)) {
          currentChain++;
          checkDate = uniqueDates[i];
        } else {
          if (currentChain > longestStreak) {
            longestStreak = currentChain;
          }
          currentChain = 1;
          checkDate = uniqueDates[i];
        }
      }
      if (currentChain > longestStreak) {
        longestStreak = currentChain;
      }
    }

    console.log(`Streaks calculated. Wallet: ${wallet}, Current: ${currentStreak}, Longest: ${longestStreak}`);

    return NextResponse.json({
      currentStreak,
      longestStreak,
      lastLogDate,
    });
  } catch (error: any) {
    console.error("streak API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}
