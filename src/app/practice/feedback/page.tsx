"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePractice } from "@/context/PracticeContext";
import { VoiceMessageBubble } from "@/components/ui/VoiceMessageBubble";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";
import Link from "next/link";

function FeedbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sessions } = usePractice();
  
  const id = searchParams.get("id");
  const session = sessions.find((s) => s.id === id);

  const [isPlayingOriginal, setIsPlayingOriginal] = React.useState(false);
  const originalAudioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (originalAudioRef.current) {
        originalAudioRef.current.pause();
        originalAudioRef.current = null;
      }
    };
  }, []);

  const toggleOriginalPlayback = () => {
    playSound("tap");
    if (!session || !session.audioUrl) return;

    if (!originalAudioRef.current) {
      const audio = new Audio(session.audioUrl);
      originalAudioRef.current = audio;
      audio.onended = () => {
        setIsPlayingOriginal(false);
      };
      audio.onerror = () => {
        setIsPlayingOriginal(false);
      };
    }

    if (isPlayingOriginal) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    } else {
      originalAudioRef.current.play()
        .then(() => {
          setIsPlayingOriginal(true);
        })
        .catch((e) => {
          console.warn("Original audio play failed:", e);
        });
    }
  };

  useEffect(() => {
    if (session) {
      playSound("success");
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <h2 className="font-serif text-xl font-medium text-ink">Session Not Found</h2>
        <p className="text-sm text-muted">We couldn&rsquo;t find the practice session you just logged.</p>
        <Button variant="secondary" onClick={() => router.push("/practice")}>
          Back to Practice Log
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-8 items-center">
      {/* Header */}
      <div className="text-center w-full">
        <span className="text-[10px] text-accent font-semibold tracking-widest uppercase">
          Session Saved
        </span>
        <h1 className="font-serif text-2xl font-medium text-ink mt-1.5">
          {session.title}
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          {new Date(session.timestamp).toLocaleDateString()} · {session.duration}s reflections
        </p>
      </div>

      {/* Spoken Feedback Bubble (Emotional Core) */}
      <div className="w-full flex flex-col items-center gap-1">
        <h2 className="w-full text-left text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">
          Spoken Feedback
        </h2>
        <VoiceMessageBubble
          text={session.feedback.text}
          audioUrl={session.feedbackAudioUrl}
          senderName="Practice Guide"
          timestamp="Just now"
        />
      </div>

      {/* Your Reflection Card */}
      <div className="w-full flex flex-col gap-2">
        <h2 className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-1 flex justify-between items-center">
          <span>Your Logged Entry</span>
          {session.type === "voice" && session.audioUrl && (
            <button
              onClick={toggleOriginalPlayback}
              className="text-[10px] text-accent hover:text-accent-hover font-semibold flex items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              {isPlayingOriginal ? (
                <>
                  <svg className="w-3 h-3 fill-current animate-[pulse_1s_infinite]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  Pause My Voice
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Listen to My Voice
                </>
              )}
            </button>
          )}
        </h2>
        <Card className="p-4 bg-bg border-border/80">
          <p className="text-xs text-ink leading-relaxed font-sans">
            {session.content}
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3 mt-4">
        <Link href="/practice" className="w-full">
          <Button variant="primary" className="w-full py-3 text-sm">
            Log another session
          </Button>
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/practice/dashboard" className="w-full">
            <Button variant="secondary" className="w-full text-xs py-2.5">
              View Dashboard
            </Button>
          </Link>
          <Link href="/practice/milestones" className="w-full">
            <Button variant="secondary" className="w-full text-xs py-2.5">
              Mint Milestones
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
          <svg className="animate-spin h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-muted">Retrieving session details...</p>
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
