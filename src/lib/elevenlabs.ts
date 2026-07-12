const apiKey = process.env.ELEVENLABS_API_KEY;
const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17"; // Roger (premade free)

export async function textToSpeech(text: string, customVoiceId?: string): Promise<string | null> {
  console.log(`Generating speech with ElevenLabs for text length: ${text.length}`);

  if (!apiKey) {
    console.log("ElevenLabs API Key not found. Speech synthesis will fall back to browser SpeechSynthesis.");
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
        model_id: "eleven_turbo_v2", // turbo v2 is fast and cost-effective
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
    
    console.log("ElevenLabs voice generation successful.");
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    if (customVoiceId) {
      console.warn("Custom ElevenLabs voice failed, falling back to default voice:", error);
      return textToSpeech(text); // Fallback recursively without customVoiceId
    }
    console.error("ElevenLabs synthesis failed, falling back to browser TTS:", error);
    return null;
  }
}
