"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePractice } from "@/context/PracticeContext";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";

type Mode = "voice" | "text";
type RecordStatus = "idle" | "recording" | "processing";

export default function LogScreen() {
  const router = useRouter();
  const { addSession } = usePractice();
  
  const [mode, setMode] = useState<Mode>("voice");
  const [status, setStatus] = useState<RecordStatus>("idle");
  const [timer, setTimer] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptionRef = useRef("");

  useEffect(() => {
    return () => {
      stopTimer();
      stopAudioVisualization();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startTimer = () => {
    setTimer(0);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  // Start voice recording with live canvas visualizer
  const handleStartRecording = async () => {
    playSound("tap");
    audioChunksRef.current = [];
    setErrorMessage("");
    transcriptionRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus("processing");
        stopAudioVisualization();

        // Stop Speech Recognition if still running
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
          recognitionRef.current = null;
        }

        // Wait a brief moment to catch final speech words processed by the engine
        await new Promise((resolve) => setTimeout(resolve, 350));
        
        // Create audio URL
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Get the real transcribed speech text or fallback to template if empty
        const speechText = transcriptionRef.current;
        const finalContent = speechText 
          ? speechText 
          : (titleInput 
              ? `Transcribed practice of "${titleInput}". Captured ${timer} seconds of audio reflection.`
              : `Spoken reflection logged. Captured ${timer} seconds of audio session.`);

        // Save session
        const session = await addSession(
          "voice",
          finalContent,
          titleInput || "Voice Practice Session",
          timer,
          audioUrl
        );

        // Redirect to feedback
        router.push(`/practice/feedback?id=${session.id}`);
      };

      // Start Web Speech recognition
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        
        let localTranscript = "";
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              localTranscript += event.results[i][0].transcript + " ";
            }
          }
          transcriptionRef.current = localTranscript.trim();
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition warning:", e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // Start visualization
      startAudioVisualization(stream);

      // Start recording
      mediaRecorder.start();
      setStatus("recording");
      startTimer();
    } catch (err: unknown) {
      console.error("Error accessing microphone:", err);
      setErrorMessage("Could not access microphone. Using text input instead.");
      setMode("text");
    }
  };

  const handleStopRecording = () => {
    playSound("tap");
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  // Set up Web Audio Analyser and canvas rendering
  const startAudioVisualization = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        if (!analyserRef.current) return;
        
        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#F7F4EF"; // match background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw flat clean lines
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        ctx.fillStyle = "#C1440E"; // terracotta
        for (let i = 0; i < bufferLength; i++) {
          // Normalize height
          barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
          
          // Draw round-capped line
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, canvas.height - barHeight - 4, barWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          x += barWidth + 3;
        }
      };

      draw();
    } catch (e) {
      console.error("Audio visualizer error", e);
    }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  // Log written text practice session
  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setStatus("processing");
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const session = await addSession(
      "text",
      textInput,
      titleInput || "Text Practice Session",
      60 // mock 1 min duration
    );

    setStatus("idle");
    setTextInput("");
    setTitleInput("");
    router.push(`/practice/feedback?id=${session.id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto min-h-[60vh] gap-6">
      {/* Title block */}
      <div className="text-center w-full">
        <h1 className="font-serif text-2xl font-medium text-ink">
          New Practice Session
        </h1>
        <p className="text-xs text-muted mt-1.5">
          {mode === "voice" ? "Record audio reflection" : "Write down what you practiced"}
        </p>
      </div>

      {errorMessage && (
        <div className="w-full text-xs bg-accent/5 text-accent border border-accent/20 rounded-xl p-3 text-center">
          {errorMessage}
        </div>
      )}

      {/* Title Input field */}
      <div className="w-full">
        <label htmlFor="session-title" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
          Practice Title (e.g. scales, piece name)
        </label>
        <input
          id="session-title"
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="What did you focus on today?"
          disabled={status !== "idle"}
          className="w-full px-4 py-3 bg-card-surface border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50 disabled:opacity-50"
        />
      </div>

      {/* Toggle View */}
      {status === "idle" && (
        <div className="flex gap-2 bg-card-surface border border-border p-1 rounded-full text-xs">
          <button
            onClick={() => {
              playSound("tap");
              setMode("voice");
            }}
            className={`px-4 py-1.5 rounded-full transition-colors cursor-pointer ${
              mode === "voice" 
                ? "bg-accent text-bg" 
                : "text-muted hover:text-ink"
            }`}
          >
            Voice Memo
          </button>
          <button
            onClick={() => {
              playSound("tap");
              setMode("text");
            }}
            className={`px-4 py-1.5 rounded-full transition-colors cursor-pointer ${
              mode === "text" 
                ? "bg-accent text-bg" 
                : "text-muted hover:text-ink"
            }`}
          >
            Written Log
          </button>
        </div>
      )}

      {/* Voice Mode Content */}
      {mode === "voice" && (
        <div className="w-full flex flex-col items-center gap-8 py-4">
          {status === "idle" && (
            <div className="flex flex-col items-center gap-6">
              {/* Massive Record Button */}
              <button
                onClick={handleStartRecording}
                className="w-28 h-28 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm focus:outline-none relative"
                aria-label="Start recording"
              >
                <div className="w-20 h-20 rounded-full border border-bg/30 flex items-center justify-center">
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                </div>
              </button>
              <p className="text-sm font-medium text-ink">Tap to record</p>
            </div>
          )}

          {status === "recording" && (
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Waveform Canvas */}
              <div className="w-full h-20 bg-bg border border-border/80 rounded-xl overflow-hidden">
                <canvas ref={canvasRef} width={350} height={80} className="w-full h-full" />
              </div>

              {/* Pulsing indicator */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                <span className="font-mono text-lg font-medium text-ink">{formatTimer(timer)}</span>
              </div>

              {/* Stop Button */}
              <button
                onClick={handleStopRecording}
                className="w-16 h-16 rounded-full border border-ink text-ink hover:bg-ink hover:text-bg flex items-center justify-center cursor-pointer transition-colors focus:outline-none"
                aria-label="Stop recording"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
              <p className="text-xs text-muted">Tap to finish and get feedback</p>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <svg className="animate-spin h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm font-medium text-ink font-serif">Analyzing practice session...</p>
              <p className="text-xs text-muted">Transcribing audio and generating feedback</p>
            </div>
          )}
        </div>
      )}

      {/* Text Mode Content */}
      {mode === "text" && (
        <form onSubmit={handleSubmitText} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="session-reflection" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
              Reflections
            </label>
            <textarea
              id="session-reflection"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="What went well today? What fell apart? What requires repetition tomorrow?"
              disabled={status === "processing"}
              rows={6}
              className="w-full px-4 py-3 bg-card-surface border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50 resize-none font-sans leading-relaxed disabled:opacity-50"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!textInput.trim() || status === "processing"}
            className="w-full py-3 text-sm cursor-pointer"
          >
            {status === "processing" ? (
              <span className="flex items-center gap-1.5 justify-center">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Journal Entry...
              </span>
            ) : (
              "Log Practice Reflection"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
