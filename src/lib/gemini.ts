import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;

// Fallback response structures
const FALLBACKS = [
  {
    feedbackText: "Great effort today! You covered important ground. Try reviewing what you learned by explaining it in your own words — that's where real understanding clicks.",
    sentiment: "improving",
    specificNote: "Building solid foundations."
  },
  {
    feedbackText: "Steady session. You're showing consistency which is key. Next time, challenge yourself to go a bit deeper on one specific concept rather than covering many.",
    sentiment: "steady",
    specificNote: "Consistent learning pace."
  },
  {
    feedbackText: "It sounds like some concepts were tricky this session. That's completely normal — struggle is where growth happens. Try breaking the difficult parts into smaller pieces.",
    sentiment: "struggling",
    specificNote: "Working through challenges."
  }
];

let genAI: any = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error("Failed to initialize Google Gen AI client:", e);
  }
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

    // History formatting
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
You are a supportive, knowledgeable personal learning coach and practice tutor.
Analyze the following student's practice session log for the skill/subject: "${instrument}".

Recent Practice History:
${historyContext}

Current Session Reflection:
"${content}"

Provide constructive, warm, specific guidance based on EXACTLY what the student described. Reference the actual topics, concepts, or skills they mentioned. Do not use generic praise. Note any progress or struggles based on their past history if relevant.

Return the response strictly as a JSON object matching this structure:
{
  "feedbackText": "Direct warm spoken feedback to the student referencing what they actually practiced (2-3 sentences)",
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
      setTimeout(() => reject(new Error("Gemini API call timed out")), 15000)
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
Draft a highly dramatic, short 35-45 word movie trailer script narrating this student's learning dedication. 
Review their history:
${historyContext}
They have just earned the milestone: "${milestoneName}".

Write a voiceover script summarizing their struggle, sweat, and ultimate triumph. Start with a hook like 'It began with...' or similar narrative. Keep it under 45 words. Output ONLY the narrator's spoken words. Do not write any stage directions or audio cues (no bracketed text).
`;

    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out")), 15000)
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
