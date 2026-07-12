"use client";

import React, { useState, useEffect, useRef } from "react";
import { Milestone, usePractice } from "@/context/PracticeContext";
import { Card } from "./Card";
import { Button } from "./Button";
import { playSound } from "@/lib/sounds";

interface MilestoneCardProps {
  milestone: Milestone;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone }) => {
  const { wallet, mintMilestone } = usePractice();
  const [isMinting, setIsMinting] = useState(false);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  // Cinematic Trailer states
  const [trailerAudio, setTrailerAudio] = useState<string | null>(null);
  const [trailerScript, setTrailerScript] = useState("");
  const [isGeneratingTrailer, setIsGeneratingTrailer] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const trailerAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      // Pause any playing audio sample on unmount
      if (trailerAudioRef.current) {
        trailerAudioRef.current.pause();
        trailerAudioRef.current = null;
      }
    };
  }, []);

  const handleMint = async () => {
    setIsMinting(true);
    try {
      await mintMilestone(milestone.id);
      playSound("stamp");
      setIsRevealOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMinting(false);
    }
  };

  const handleGenerateTrailer = async () => {
    playSound("tap");
    setIsGeneratingTrailer(true);
    try {
      const response = await fetch("/api/voice/trailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet,
          milestoneName: milestone.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate trailer narration");
      }

      const data = await response.json();
      setTrailerScript(data.script);
      setTrailerAudio(data.audioUrl);

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        trailerAudioRef.current = audio;
        audio.play();
        setIsPlayingTrailer(true);
        audio.onended = () => setIsPlayingTrailer(false);
      }
    } catch (e) {
      console.error("Error creating trailer:", e);
    } finally {
      setIsGeneratingTrailer(false);
    }
  };

  const toggleTrailerPlayback = () => {
    playSound("tap");
    if (!trailerAudioRef.current) return;

    if (isPlayingTrailer) {
      trailerAudioRef.current.pause();
      setIsPlayingTrailer(false);
    } else {
      trailerAudioRef.current.play();
      setIsPlayingTrailer(true);
    }
  };

  const truncatedTx = milestone.txHash 
    ? `${milestone.txHash.slice(0, 6)}...${milestone.txHash.slice(-6)}` 
    : "";

  return (
    <>
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        milestone.unlocked 
          ? "border-border" 
          : "border-border/40 opacity-60"
      }`}>
        {/* Subtle top indicator bar */}
        <div className={`absolute top-0 left-0 w-full h-[3px] ${
          milestone.minted 
            ? "bg-verified" 
            : milestone.unlocked 
              ? "bg-accent" 
              : "bg-border/40"
        }`} />

        <div className="flex flex-col gap-4 pt-1">
          {/* Title and Requirements */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif font-medium text-lg text-ink">
                {milestone.name}
              </h3>
              {milestone.minted ? (
                <span className="text-[10px] bg-verified/10 text-verified border border-verified/20 px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">
                  Verified
                </span>
              ) : milestone.unlocked ? (
                <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">
                  Unlocked
                </span>
              ) : (
                <span className="text-[10px] bg-border text-muted px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">
                  Locked
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {milestone.requirement}
            </p>
          </div>

          {/* Action / Blockchain details */}
          <div className="pt-2 border-t border-border/60 flex flex-col gap-3">
            {milestone.minted ? (
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted">On-Chain Ledger</span>
                  <span className="font-mono text-ink">Solana Devnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Signature</span>
                  <a
                    href={`https://explorer.solana.com/tx/${milestone.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:underline flex items-center gap-1"
                  >
                    {truncatedTx}
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Timestamp</span>
                  <span className="font-mono text-ink">
                    {new Date(milestone.timestamp || "").toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : milestone.unlocked ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-muted max-w-[150px] leading-snug">
                  Earned. Add this milestone to the permanent ledger.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMint}
                  disabled={isMinting}
                  className="shrink-0"
                >
                  {isMinting ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Minting...
                    </span>
                  ) : (
                    "Mint Ledger Proof"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Keep practicing to unlock this proof.</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Theatrical Wax Seal Full-screen Takeover Overlay */}
      {isRevealOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
          {/* Inner content wrapper */}
          <div className="max-w-md w-full flex flex-col items-center gap-6 overflow-y-auto max-h-[90vh] py-4">
            
            {/* Wax Seal Circle Logo (Animated heavy landing) */}
            <div className="relative w-28 h-28 flex items-center justify-center animate-stamp shrink-0">
              {/* Hot wax outline shape */}
              <svg className="w-full h-full text-accent drop-shadow-[0_8px_16px_rgba(193,68,14,0.3)] fill-current" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50,5 C69,3 89,12 93,32 C97,52 93,73 79,87 C65,99 37,97 21,87 C5,77 2,52 7,35 C12,17 30,7 50,5 Z" />
                <circle cx="50" cy="50" r="33" className="stroke-background fill-none" strokeWidth="1.5" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="27" className="fill-current opacity-20" />
              </svg>
              {/* Crest center letters */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-background font-serif">
                <span className="text-[8px] uppercase tracking-widest font-semibold opacity-80">Sealed</span>
                <span className="text-base font-bold leading-none tracking-tighter mt-0.5">P·O·P</span>
                <span className="text-[8px] uppercase tracking-wider font-semibold opacity-60 mt-0.5">Proof</span>
              </div>
            </div>

            {/* Verification message details */}
            <div className="flex flex-col gap-2 animate-fade-in-up shrink-0" style={{ animationDelay: "250ms" }}>
              <span className="text-[10px] text-accent font-semibold tracking-widest uppercase">On-Chain Ledger Proof</span>
              <h2 className="font-serif text-2xl font-medium text-ink leading-tight">
                Milestone Sealed
              </h2>
              <p className="text-xs text-muted font-serif italic max-w-xs mx-auto leading-relaxed">
                &ldquo;{milestone.requirement}&rdquo;
              </p>
            </div>

            {/* On-Chain details wax cracking box */}
            <div className="w-full border border-border bg-card-surface/70 rounded-2xl p-4 flex flex-col gap-2.5 text-[11px] text-left animate-fade-in-up shrink-0" style={{ animationDelay: "500ms" }}>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted">Milestone</span>
                <span className="font-semibold text-ink">{milestone.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted">Network</span>
                <span className="font-mono text-ink">Solana Devnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Signature</span>
                <a
                  href={`https://explorer.solana.com/tx/${milestone.txHash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-accent hover:underline flex items-center gap-1 text-[10px]"
                >
                  {milestone.txHash ? `${milestone.txHash.slice(0, 10)}...${milestone.txHash.slice(-10)}` : ""}
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Cinematic Journey Trailer Generator Card */}
            <div className="w-full animate-fade-in-up shrink-0" style={{ animationDelay: "600ms" }}>
              {!trailerAudio && !isGeneratingTrailer && (
                <button
                  onClick={handleGenerateTrailer}
                  className="w-full py-2.5 px-4 bg-background border border-accent/20 hover:border-accent/40 text-accent text-[11px] font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:bg-accent/5 focus:outline-none transition-all shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zm-6.75 11.25L10 18l-1.25-2.75L6 14l2.75-1.25L10 10l1.25 2.75L14 14l-2.75 1.25z" />
                  </svg>
                  Generate Cinematic Journey Trailer
                </button>
              )}

              {isGeneratingTrailer && (
                <div className="w-full py-4 border border-dashed border-accent/20 bg-accent/5 rounded-2xl flex flex-col items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[10px] text-accent font-semibold uppercase tracking-wider animate-pulse">
                    AI composing movie narration...
                  </span>
                </div>
              )}

              {trailerAudio && (
                <div className="w-full border border-accent/20 bg-accent/5 p-4 rounded-2xl flex flex-col gap-2.5 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-accent font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                      Cinematic Journey Trailer
                    </span>
                    <button
                      onClick={toggleTrailerPlayback}
                      className="p-1 rounded-full hover:bg-accent/10 text-accent cursor-pointer focus:outline-none"
                      title={isPlayingTrailer ? "Pause Trailer" : "Play Trailer"}
                    >
                      {isPlayingTrailer ? (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-serif italic text-ink/90 leading-relaxed border-l-2 border-accent/40 pl-3">
                    &ldquo;{trailerScript}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Acknowledge Button */}
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                playSound("tap");
                // Stop audio playback if playing
                if (trailerAudioRef.current) {
                  trailerAudioRef.current.pause();
                  trailerAudioRef.current = null;
                }
                setIsPlayingTrailer(false);
                setIsRevealOpen(false);
              }}
              className="w-full mt-2 py-3 text-sm animate-fade-in-up cursor-pointer shrink-0"
              style={{ animationDelay: "700ms" }}
            >
              Acknowledge Proof
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
