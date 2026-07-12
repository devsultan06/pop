"use client";

import React, { useState, useEffect, useRef } from "react";

interface VoiceMessageBubbleProps {
  text: string;
  senderName?: string;
  timestamp?: string;
  audioUrl?: string; // base64 speech audio data URL
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  text,
  senderName = "Practice Guide",
  timestamp = "Just now",
  audioUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Generate 24 pseudo-random bar heights for the waveform
  const barHeights = [
    12, 24, 8, 16, 32, 14, 28, 10, 22, 18, 36, 12, 30, 26, 40, 14, 20, 8, 34, 16, 24, 10, 18, 12
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      if (audioUrl) {
        // Initialize an Audio element to read duration and play
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        
        audio.onloadedmetadata = () => {
          setDuration(Math.max(1, Math.round(audio.duration)));
        };
        audio.ontimeupdate = () => {
          setCurrentTime(Math.round(audio.currentTime));
        };
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
        audio.onerror = () => {
          console.warn("Error playing ElevenLabs audio, fallback to SpeechSynthesis");
          audioPlayerRef.current = null;
          // Calculate approx duration for TTS fallback
          const words = text.split(" ").length;
          setDuration(Math.max(3, Math.round((words / 140) * 60)));
        };
      } else {
        // Calculate approximate duration based on text length (avg 140 WPM)
        const words = text.split(" ").length;
        const calculatedDuration = Math.max(3, Math.round((words / 140) * 60));
        setDuration(calculatedDuration);
      }
    }

    return () => {
      stopSpeech();
    };
  }, [text, audioUrl]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          stopSpeech();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopSpeech = () => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch (e) {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    stopTimer();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayback = () => {
    // 1. Play using custom ElevenLabs synthesized audio if available
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((e) => {
            console.warn("Audio play failed, falling back to TTS:", e);
            playTTSFallback();
          });
      }
      return;
    }

    // 2. Play using local text-to-speech fallback
    playTTSFallback();
  };

  const playTTSFallback = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      stopTimer();
      setIsPlaying(false);
    } else {
      // If already speaking but paused, resume
      if (synthRef.current.speaking && synthRef.current.paused) {
        synthRef.current.resume();
        startTimer();
        setIsPlaying(true);
      } else {
        // Start new speech
        stopSpeech();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find a warm, clean voice if available
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(
          (v) => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Natural")
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => {
          setIsPlaying(false);
          stopTimer();
          setCurrentTime(0);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
          stopTimer();
          setCurrentTime(0);
        };

        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
        
        startTimer();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-2 max-w-lg w-full">
      {/* Sender profile */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-serif font-medium text-ink">{senderName}</span>
        <span className="text-[10px] text-muted tracking-wider uppercase">{timestamp}</span>
      </div>

      {/* Bubble Container */}
      <div className="bg-card-surface border border-border rounded-xl p-5 flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          className="w-10 h-10 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center cursor-pointer transition-colors focus:outline-none shrink-0"
          aria-label={isPlaying ? "Pause feedback" : "Play feedback"}
        >
          {isPlaying ? (
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="4" width="4" height="16" rx="1" />
              <rect x="16" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 fill-current translate-x-[1px]"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Waveform and Progress */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-end gap-[3px] h-10 w-full" aria-hidden="true">
            {barHeights.map((height, index) => {
              // Calculate highlight fraction
              const fraction = index / barHeights.length;
              const playbackFraction = duration > 0 ? currentTime / duration : 0;
              const isHighlighted = playbackFraction >= fraction;

              // Animation style when playing
              const animationDelay = `${index * 0.05}s`;

              return (
                <span
                  key={index}
                  className={`w-[3px] rounded-full transition-colors duration-300 ${
                    isHighlighted ? "bg-accent" : "bg-border"
                  } ${
                    isPlaying ? "animate-[barGrow_1.2s_infinite_ease-in-out]" : ""
                  }`}
                  style={{
                    height: `${height}px`,
                    animationDelay: isPlaying ? animationDelay : undefined,
                    transformOrigin: "bottom",
                  }}
                />
              );
            })}
          </div>

          {/* Time trackers */}
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Transcript Textbox (collapsible or quietly present underneath) */}
      <div className="px-1 mt-1">
        <p className="text-xs text-muted leading-relaxed font-sans italic">
          &ldquo;{text}&rdquo;
        </p>
      </div>
    </div>
  );
};
