import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;
// Trigger redeploy to apply new Vercel environment variables

// Fallback feedbacks in case API Key is missing or model fails
const FALLBACKS = [
  {
    feedbackText: "You are showing consistent pitch correction on shifts. Keep your wrist flexible during transitions; tension accumulates there. Pacing was steady.",
    sentiment: "improving",
    specificNote: "Shift transitions are cleaner."
  },
  {
    feedbackText: "Solid breathing pacing in this section. The projection was even. In future sessions, try to count the rest bars actively to maintain perfect metrics.",
    sentiment: "steady",
    specificNote: "Even dynamic projection."
  },
  {
    feedbackText: "The tempo rushed slightly in the middle triplets section. Try running it at 60 bpm first before playing up to speed.",
    sentiment: "struggling",
    specificNote: "Middle section triplet rushing."
  }
];

let genAI: any = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Google Gen AI client initialized.");
  } catch (e) {
    console.error("Failed to initialize Google Gen AI client:", e);
  }
} else {
  console.log("Google AI API Key not found. Gemini running in mock fallback mode.");
}


interface AnalysisResult {
  feedbackText: string;
  sentiment: "improving" | "steady" | "struggling";
  specificNote: string;
}

export async function analyzePracticeSession(
  content: string,
  history: any[] = [],
  instrument: string = "general"
): Promise<AnalysisResult> {
  console.log(`Analyzing practice session with Gemini (Instrument: ${instrument})`);

  if (!genAI) {
    console.log("Using Gemini mock feedback fallback...");
    const idx = Math.floor(Math.random() * FALLBACKS.length);
    return FALLBACKS[idx] as AnalysisResult;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Format previous logs into string context
    const historyContext = history.length > 0
      ? history
          .map(
            (h) =>
              `- Session [${h.TIMESTAMP || h.timestamp}]: ${h.CONTENT || h.content}\n  Feedback: ${
                h.FEEDBACK_TEXT || h.feedback?.text
              }`
          )
          .join("\n")
      : "No previous sessions logged.";

    const prompt = `
You are a master music instructor and practice guide.
Analyze the following student's practice session log for the instrument/skill: "${instrument}".

Recent Practice History:
${historyContext}

Current Session Reflection:
"${content}"

Provide constructive, warm, specific guidance. Do not use generic praise. Note any progress or struggles based on their past history if relevant.

Return the response strictly as a JSON object matching this structure:
{
  "feedbackText": "Direct warm spoken feedback to the student (2-3 sentences)",
  "sentiment": "improving" | "steady" | "struggling",
  "specificNote": "A very brief 3-5 word diagnostic note summarizing this session's core insight"
}
`;

    const generatePromise = model.generateContent({
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out")), 6500)
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);

    const text = result.response.text();
    console.log("Gemini Response Raw:", text);

    const parsed = JSON.parse(text);
    return {
      feedbackText: parsed.feedbackText || "Keep up the consistent work. You are making progress.",
      sentiment: parsed.sentiment || "steady",
      specificNote: parsed.specificNote || "Steady repetition progress."
    };
  } catch (error) {
    console.error("Gemini query failed, falling back:", error);
    const idx = Math.floor(Math.random() * FALLBACKS.length);
    return FALLBACKS[idx] as AnalysisResult;
  }
}

export async function generateTrailerScript(
  walletAddress: string,
  milestoneName: string,
  history: any[] = []
): Promise<string> {
  console.log(`Generating epic trailer script for ${walletAddress} on ${milestoneName}`);

  if (!genAI) {
    return getMockTrailerScript(milestoneName);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const historyContext = history.length > 0
      ? history.map((h, i) => `Log ${i + 1}: ${h.CONTENT || h.content || h.title || ""}`).join("\n")
      : "No practice logs found.";

    const prompt = `
You are an epic cinematic movie trailer narrator. Your voice is extremely deep, dramatic, and intense.
Draft a highly dramatic, short 35-45 word movie trailer script narrating this student's musical dedication. 
Review their history:
${historyContext}
They have just earned the milestone: "${milestoneName}".

Write a voiceover script summarizing their struggle, sweat, and ultimate triumph. Start with a hook like 'It began with...' or similar narrative. Keep it under 45 words. Output ONLY the narrator's spoken words. Do not write any stage directions or audio cues (no bracketed text).
`;

    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out")), 6500)
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const text = result.response.text().trim();
    console.log("Gemini Trailer Script Raw:", text);
    
    // Clean up quotes, brackets, stars
    return text.replace(/\[.*?\]/g, "").replace(/[*"]/g, "").trim();
  } catch (error) {
    console.error("Gemini trailer generation failed, falling back:", error);
    return getMockTrailerScript(milestoneName);
  }
}

function getMockTrailerScript(milestoneName: string): string {
  if (milestoneName === "First Step") {
    return "It began with a single note, echoing in the quiet. A lazy finger shift, a metronome that wouldn't lie. Today, he logs his first verified proof. The journey of a thousand scales has officially begun.";
  } else if (milestoneName === "Dedication Trio") {
    return "Three days of struggle. Three days of sweat. While the world slept, the scales hummed. He conquered the tempo shifts. He conquered the fatigue. The Dedication Trio is sealed.";
  } else if (milestoneName === "Weekly Ritual" || milestoneName === "Half-Fortnight") {
    return "A testament of will. Obsession turned to art. The joints ache, but the cadence is steady. A weekly ritual verified, sealed forever on the eternal ledger.";
  } else {
    return "A test of will. A testament of strength. The fingers bleed, the Metronome bows. A champion of dedication arises, sealing this milestone on the eternal chain.";
  }
}
