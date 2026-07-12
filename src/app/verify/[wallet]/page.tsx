"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { playSound } from "@/lib/sounds";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

interface VerifiedMilestone {
  name: string;
  txHash: string;
  timestamp: string;
}

interface ProfileData {
  wallet: string;
  totalSessions: number;
  currentStreak: number;
  joinedAt: string;
  milestones: VerifiedMilestone[];
}

export default function VerificationScreen() {
  const params = useParams();
  const router = useRouter();
  const targetWallet = params.wallet as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!targetWallet) return;

    const fetchVerificationData = async () => {
      try {
        const response = await fetch(`/api/verify?wallet=${targetWallet}`);
        if (!response.ok) {
          throw new Error("Could not load verification profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        console.error("Verification screen error:", err);
        setError(err.message || "Failed to retrieve verification records.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationData();
  }, [targetWallet]);

  const handleStartOwn = () => {
    playSound("tap");
    router.push("/");
  };

  const truncatedWallet = targetWallet 
    ? `${targetWallet.slice(0, 6)}...${targetWallet.slice(-6)}` 
    : "";

  return (
    <div className="min-h-screen bg-bg text-ink py-10 px-4 flex flex-col items-center justify-between">
      {/* Header Logo */}
      <header className="w-full max-w-md flex justify-between items-center mb-8">
        <div 
          onClick={handleStartOwn} 
          className="flex items-center gap-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
        >
          <Logo />
        </div>
        <span className="text-[9px] font-mono tracking-widest text-muted border border-border px-2 py-0.5 rounded uppercase">
          Ledger Verify
        </span>
      </header>

      {/* Main Verification Card */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-center gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <svg className="animate-spin h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-muted font-serif italic">Loading verification ledger...</span>
          </div>
        ) : error || !profile ? (
          <Card className="p-6 text-center border-border bg-card-surface/40 flex flex-col gap-4">
            <h3 className="font-serif text-lg font-medium text-ink">Verification Record Missing</h3>
            <p className="text-xs text-muted leading-relaxed">
              We couldn't retrieve practice records for this address. Verify that the Solana URL parameter is correct.
            </p>
            <Button size="sm" onClick={handleStartOwn} className="text-xs mt-2">
              Start Practice Journal
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Authenticity Certificate Card */}
            <Card className="p-6 border-border bg-card-surface relative shadow-sm overflow-hidden">
              {/* Certificate watermark SVG */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 text-border/20 fill-current select-none pointer-events-none">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50,5 C69,3 89,12 93,32 C97,52 93,73 79,87 C65,99 37,97 21,87 C5,77 2,52 7,35 C12,17 30,7 50,5 Z" />
                </svg>
              </div>

              <div className="flex flex-col gap-6">
                {/* Header status */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-accent font-semibold tracking-widest uppercase">Verified Record</span>
                    <h1 className="font-serif text-2xl font-medium text-ink mt-0.5">Practice Certificate</h1>
                  </div>
                  <div className="flex items-center gap-1.5 text-verified bg-verified/10 border border-verified/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
                    Sealed
                  </div>
                </div>

                {/* Target Wallet address block */}
                <div className="border-y border-border/60 py-3.5 my-1">
                  <div className="text-[9px] text-muted uppercase tracking-wider mb-1">Solana Address</div>
                  <div className="font-mono text-xs text-ink bg-border/20 px-2.5 py-1.5 rounded break-all select-all">
                    {profile.wallet}
                  </div>
                </div>

                {/* Metrics Stats row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="flex flex-col border border-border/80 bg-card-surface/40 p-2 rounded-xl">
                    <span className="text-[10px] text-muted">Total Practices</span>
                    <span className="font-serif font-semibold text-lg text-ink mt-1">
                      {profile.totalSessions}
                    </span>
                  </div>
                  <div className="flex flex-col border border-border/80 bg-card-surface/40 p-2 rounded-xl">
                    <span className="text-[10px] text-muted">Active Streak</span>
                    <span className="font-serif font-semibold text-lg text-ink mt-1 flex justify-center items-center gap-0.5">
                      {profile.currentStreak}
                      <span className="text-accent text-sm">🔥</span>
                    </span>
                  </div>
                  <div className="flex flex-col border border-border/80 bg-card-surface/40 p-2 rounded-xl">
                    <span className="text-[10px] text-muted">Ledger Age</span>
                    <span className="font-serif font-semibold text-[11px] text-ink mt-2.5 leading-none">
                      {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Minted Milestones List */}
            <div>
              <h3 className="font-serif text-sm font-semibold tracking-wider text-muted uppercase mb-3 px-1">
                Verified On-Chain Milestones ({profile.milestones.length})
              </h3>
              <div className="flex flex-col gap-3">
                {profile.milestones.length === 0 ? (
                  <p className="text-xs text-muted italic p-4 text-center border border-dashed border-border rounded-xl">
                    No milestones minted on-chain yet.
                  </p>
                ) : (
                  profile.milestones.map((m, idx) => (
                    <Card key={idx} className="p-4 border-border bg-card-surface/60 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* Little Wax Stamp Watermark */}
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-serif font-bold">
                          POP
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-medium text-ink leading-tight">{m.name}</h4>
                          <span className="text-[9px] text-muted font-mono">
                            Sealed {new Date(m.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <a
                        href={`https://explorer.solana.com/tx/${m.txHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-border rounded-full text-muted hover:text-accent hover:border-accent/30 bg-card-surface hover:bg-accent/5 transition-all"
                        title="View Solana Transaction"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sharing / Growth loop callout block */}
            <Card className="p-5 border-dashed border-border/80 bg-accent/5 flex flex-col gap-3 text-center rounded-2xl">
              <div className="flex flex-col gap-1">
                <span className="font-serif text-sm font-semibold text-accent">Join the Proof of Practice</span>
                <p className="text-[11px] text-muted leading-relaxed max-w-xs mx-auto">
                  Build your own verifiable history. Log reflections, analyze shifts with AI, and mint milestones on Solana.
                </p>
              </div>
              <Button size="sm" onClick={handleStartOwn} className="text-xs mx-auto px-6 cursor-pointer">
                Start Your Ledger
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center mt-10 text-[9px] text-muted uppercase tracking-widest font-mono">
        Proof of Practice © 2026 · Solana & Snowflake Protected
      </footer>
    </div>
  );
}
