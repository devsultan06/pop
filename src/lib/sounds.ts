let audioCtx: AudioContext | null = null;
let tapAudio: HTMLAudioElement | null = null;
let successAudio: HTMLAudioElement | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Lazy initialization of preloaded audio elements to prevent SSR crashes
const initPreloadedAudio = () => {
  if (typeof window === "undefined") return;
  if (!tapAudio) {
    tapAudio = new Audio("/sounds/tap.mp3");
    tapAudio.volume = 0.65;
    tapAudio.preload = "auto";
  }
  if (!successAudio) {
    successAudio = new Audio("/sounds/success.mp3");
    successAudio.volume = 0.85;
    successAudio.preload = "auto";
  }
};

// Play a synthetic soft tap using Web Audio API ( extremely low latency & reliable fallback)
const playSynthTap = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(140, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
};

// Play a synthetic gentle chime chord
const playSynthSuccess = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  
  const playTone = (freq: number, startDelay: number, duration: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + startDelay);
    
    gain.gain.setValueAtTime(0, now + startDelay);
    gain.gain.linearRampToValueAtTime(vol, now + startDelay + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);
    
    osc.start(now + startDelay);
    osc.stop(now + startDelay + duration + 0.05);
  };

  playTone(523.25, 0, 0.5, 0.25); // C5
  playTone(783.99, 0.08, 0.7, 0.2); // G5
};

// Play a physical heavy stamping thud sound
const playSynthStamp = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  
  // Triangle frequency drop for the low end thump
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  
  osc.type = "triangle";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(10, now + 0.22);
  
  oscGain.gain.setValueAtTime(0.45, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  
  // Short bandpassed white noise for the physical contact slap
  const bufferSize = ctx.sampleRate * 0.04; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 650;
  
  const noiseGain = ctx.createGain();
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
  
  osc.start(now);
  noise.start(now);
  
  osc.stop(now + 0.25);
  noise.stop(now + 0.04);
};

// Main trigger handler
export const playSound = (type: "tap" | "success" | "stamp") => {
  try {
    if (typeof window === "undefined") return;

    // Initialize elements if not done yet
    initPreloadedAudio();

    if (type === "tap") {
      if (tapAudio) {
        // Reset playhead in case of rapid successive clicks
        tapAudio.currentTime = 0;
        tapAudio.play().catch((err) => {
          console.warn("Failed to play preloaded tap.mp3, falling back to synth:", err);
          playSynthTap();
        });
      } else {
        playSynthTap();
      }
    } else if (type === "success") {
      if (successAudio) {
        successAudio.currentTime = 0;
        successAudio.play().catch((err) => {
          console.warn("Failed to play preloaded success.mp3, falling back to synth:", err);
          playSynthSuccess();
        });
      } else {
        playSynthSuccess();
      }
    } else if (type === "stamp") {
      playSynthStamp();
    }
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};
