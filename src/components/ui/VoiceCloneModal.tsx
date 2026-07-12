"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePractice } from "@/context/PracticeContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { playSound } from "@/lib/sounds";

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({ isOpen, onClose }) => {
  const { wallet, customVoiceId, saveCustomVoice, clearCustomVoice } = usePractice();
  
  const [status, setStatus] = useState<"idle" | "recording" | "uploading" | "success" | "error">("idle");
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const cleanupRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupRecording();
    };
  }, []);

  if (!isOpen) return null;

  const handleStartRecording = async () => {
    playSound("tap");
    audioChunksRef.current = [];
    setErrorMessage("");
    
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
        stopTimer();
        cleanupRecording();
        await uploadAudioSample();
      };

      mediaRecorder.start();
      setStatus("recording");
      startTimer();
    } catch (err) {
      console.error("Error accessing microphone for voice cloning:", err);
      setErrorMessage("Microphone access was denied or is unavailable.");
      setStatus("error");
    }
  };

  const handleStopRecording = () => {
    playSound("tap");
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadAudioSample = async () => {
    setStatus("uploading");
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-sample.webm");
      if (wallet) {
        formData.append("walletAddress", wallet);
      }

      const response = await fetch("/api/voice/clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to clone voice");
      }

      const data = await response.json();
      saveCustomVoice(data.voiceId);
      playSound("success");
      setStatus("success");
    } catch (err: any) {
      console.error("Voice cloning upload failed:", err);
      setErrorMessage(err.message || "Something went wrong uploading sample.");
      setStatus("error");
    }
  };

  const handleResetDefault = () => {
    playSound("tap");
    clearCustomVoice();
    setStatus("idle");
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 border-border bg-bg flex flex-col gap-6 relative shadow-lg">
        {/* Close Button */}
        <button
          onClick={() => {
            playSound("tap");
            onClose();
          }}
          className="absolute top-4 right-4 text-muted hover:text-ink cursor-pointer focus:outline-none p-1 rounded-full hover:bg-border/20"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {/* Header */}
        <div>
          <h2 className="font-serif text-xl font-medium text-ink">Personalize AI Mentor</h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Record 15 seconds of a teacher, mentor, or your future self. 
            Gemini's feedback will be spoken back to you in their voice!
          </p>
        </div>

        {/* Content Area */}
        <div className="flex flex-col items-center justify-center py-4 min-h-[160px] border border-dashed border-border/80 rounded-xl bg-card-surface/40 p-4">
          {/* Status Switcher */}
          {status === "idle" && !customVoiceId && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center text-accent animate-pulse">
                <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                </svg>
              </div>
              <p className="text-xs text-muted leading-snug max-w-[250px]">
                Make sure you are in a quiet room. Recommended length is 15-20 seconds.
              </p>
              <Button size="sm" onClick={handleStartRecording} className="mt-2 text-xs">
                Start Recording Sample
              </Button>
            </div>
          )}

          {status === "recording" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full border border-accent flex items-center justify-center relative">
                <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                <span className="w-3.5 h-3.5 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-lg font-semibold text-ink">
                  {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold animate-pulse">
                  Recording Sample...
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleStopRecording} className="mt-1 border-accent text-accent hover:bg-accent/5 text-xs">
                Stop & Clone Voice
              </Button>
            </div>
          )}

          {status === "uploading" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <svg className="animate-spin h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink font-serif">Analyzing voice features...</span>
                <span className="text-[10px] text-muted">Building custom Voice ID clone</span>
              </div>
            </div>
          )}

          {(status === "success" || customVoiceId) && status !== "recording" && status !== "uploading" && (
            <div className="flex flex-col items-center gap-4 text-center w-full">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink font-serif">Custom AI Voice Active</span>
                <span className="text-[10px] text-muted">
                  ID: <span className="font-mono bg-border/40 px-1 py-0.5 rounded">{customVoiceId || "Cloned"}</span>
                </span>
              </div>
              <div className="flex gap-2.5 mt-2">
                <Button variant="ghost" size="sm" onClick={handleResetDefault} className="text-xs text-muted hover:text-accent border border-border/80">
                  Reset to Default
                </Button>
                <Button size="sm" onClick={handleStartRecording} className="text-xs">
                  Record New Sample
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink font-serif">Cloning Failed</span>
                <span className="text-[10px] text-rose-600 leading-snug max-w-[200px]">{errorMessage}</span>
              </div>
              <Button size="sm" onClick={handleStartRecording} className="mt-2 text-xs">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              playSound("tap");
              onClose();
            }}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
