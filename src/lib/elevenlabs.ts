const apiKey = process.env.ELEVENLABS_API_KEY;
const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17";

export async function textToSpeech(text: string, customVoiceId?: string): Promise<string | null> {
  if (!apiKey) {
    return null;
  }

  try {
    const voiceId = customVoiceId || defaultVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs returned HTTP ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    if (customVoiceId) {
      return textToSpeech(text);
    }
    console.error("Speech synthesis failed:", error);
    return null;
  }
}
