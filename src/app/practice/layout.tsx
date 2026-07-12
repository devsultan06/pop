"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePractice } from "@/context/PracticeContext";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { playSound } from "@/lib/sounds";
import { VoiceCloneModal } from "@/components/ui/VoiceCloneModal";
import bs58 from "bs58";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { wallet, isDemoMode, connectWallet, connectDemoMode, disconnectWallet, theme, toggleTheme, customVoiceId } = usePractice();
  const [connectError, setConnectError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const navItems = [
    {
      label: "Practice",
      href: "/practice",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      label: "Dashboard",
      href: "/practice/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Milestones",
      href: "/practice/milestones",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
  ];

  // Try to connect Solana browser extension (Phantom)
  const handleConnectWallet = async () => {
    setConnectError("");
    setIsVerifying(true);
    
    try {
      const solana = (window as any).solana;
      
      if (!solana || !solana.isPhantom) {
        throw new Error("Phantom extension not detected. Try Demo Mode for instant guest access!");
      }

      // 1. Connect wallet
      const resp = await solana.connect();
      const pubKeyStr = resp.publicKey.toBase58();
      
      // Log in immediately upon connecting to avoid extension/domain message signing hangs
      connectWallet(pubKeyStr);
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      if (err.message && err.message.includes("User rejected")) {
        setConnectError("Connection cancelled. Please approve the connection request in Phantom.");
      } else {
        setConnectError(err.message || "Connection failed.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Intercept if wallet is not connected
  if (!wallet) {
    return (
      <div className="flex flex-col min-h-screen bg-bg text-ink max-w-md mx-auto px-6 gap-6">
        {/* Simple Header for Auth screen */}
        <header className="py-4 border-b border-border/80 flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" showText={true} showSubhead={false} />
          </Link>
          <button
            onClick={() => {
              playSound("tap");
              toggleTheme();
            }}
            className="p-2 rounded-full border border-border text-muted hover:text-ink hover:bg-border/30 bg-card-surface shrink-0 cursor-pointer focus:outline-none transition-all"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.1 22C6.8 22 2.5 17.7 2.5 12.4s4.3-9.6 9.6-9.6c.8 0 1.5.1 2.2.3.5.1.8.6.7 1.1-.1.5-.6.8-1.1.7-.6-.2-1.2-.3-1.8-.3-4.2 0-7.6 3.4-7.6 7.6s3.4 7.6 7.6 7.6c3.4 0 6.4-2.2 7.4-5.4.2-.5.7-.7 1.2-.6.5.2.7.7.6 1.2-1.3 4.1-5.2 6.9-9.6 6.9z" />
              </svg>
            )}
          </button>
        </header>

        <div className="flex-1 flex flex-col justify-center pb-12 gap-8">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-medium text-ink">Proof of Practice</h1>
            <p className="text-xs text-muted mt-2 max-w-xs mx-auto leading-relaxed">
              Connect your cryptographic ledger key to verify your dedication.
            </p>
          </div>

          <Card className="flex flex-col gap-5 p-6 border-border bg-card-surface text-center">
            <div>
              <h2 className="font-serif font-medium text-lg text-ink">Authenticate</h2>
              <p className="text-xs text-muted mt-1 leading-snug">
                Choose a method below to access your journal history.
              </p>
            </div>

          {connectError && (
            <div className="text-xs bg-accent/5 border border-accent/20 text-accent rounded-xl p-3 leading-normal">
              {connectError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={handleConnectWallet}
              disabled={isVerifying}
              className="py-3 text-sm flex items-center justify-center gap-2 cursor-pointer border-ink hover:bg-ink hover:text-bg"
            >
              {isVerifying ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-4 w-4 text-ink" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                  Connect Wallet (Phantom)
                </>
              )}
            </Button>


            <div className="relative flex items-center justify-center my-1 text-[10px] text-muted font-mono uppercase tracking-wider">
              <span className="bg-card-surface px-2 z-10">or</span>
              <div className="absolute w-full h-[1px] bg-border" />
            </div>

            <Button
              variant="primary"
              onClick={connectDemoMode}
              disabled={isVerifying}
              className="py-3 text-sm cursor-pointer"
            >
              Try Demo Mode →
            </Button>
          </div>

          <p className="text-[10px] text-muted leading-relaxed max-w-[280px] mx-auto">
            <strong>Demo Mode</strong> uses a temporary test wallet on Solana Devnet. No extensions or setup needed.
          </p>
        </Card>
        </div>
      </div>
    );
  }

  const truncatedWallet = wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "";

  return (
    <div className="flex flex-col min-h-screen bg-bg text-ink max-w-md md:max-w-5xl w-full mx-auto md:px-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-border/80 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" showText={true} showSubhead={false} />
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs uppercase tracking-wider font-semibold transition-colors ${
                  isActive ? "text-accent" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3.5">
          {/* Customize AI Mentor Voice (Only visible when wallet connected) */}
          {wallet && (
            <button
              onClick={() => {
                playSound("tap");
                setIsVoiceModalOpen(true);
              }}
              className={`p-2 rounded-full border shrink-0 cursor-pointer focus:outline-none transition-all ${
                customVoiceId
                  ? "border-accent text-accent hover:bg-accent/5 bg-accent/5"
                  : "border-border text-muted hover:text-ink hover:bg-border/30 bg-card-surface"
              }`}
              title="Personalize AI Mentor Voice"
              aria-label="Personalize AI Mentor Voice"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </button>
          )}

          <button
            onClick={() => {
              playSound("tap");
              toggleTheme();
            }}
            className="p-2 rounded-full border border-border text-muted hover:text-ink hover:bg-border/30 bg-card-surface shrink-0 cursor-pointer focus:outline-none transition-all"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.1 22C6.8 22 2.5 17.7 2.5 12.4s4.3-9.6 9.6-9.6c.8 0 1.5.1 2.2.3.5.1.8.6.7 1.1-.1.5-.6.8-1.1.7-.6-.2-1.2-.3-1.8-.3-4.2 0-7.6 3.4-7.6 7.6s3.4 7.6 7.6 7.6c3.4 0 6.4-2.2 7.4-5.4.2-.5.7-.7 1.2-.6.5.2.7.7.6 1.2-1.3 4.1-5.2 6.9-9.6 6.9z" />
              </svg>
            )}
          </button>
          <StreakBadge />
          
          <div className="flex items-center gap-2 border border-border px-2.5 py-1.5 rounded-full bg-card-surface">
            <span className="text-[9px] text-muted font-mono uppercase tracking-wider">
              {isDemoMode ? "Demo Mode" : truncatedWallet}
            </span>
            <button 
              onClick={disconnectWallet}
              className="text-[9px] text-accent hover:text-accent-hover font-semibold uppercase tracking-wider cursor-pointer border-none bg-none outline-none pl-1 border-l border-border"
              title="Disconnect wallet"
            >
              Out
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace content area */}
      <main className="flex-1 px-6 py-6 pb-28 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg border-t border-border px-6 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 text-[10px] tracking-wide transition-colors font-medium ${
                isActive ? "text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Voice Clone Modal Overlay */}
      <VoiceCloneModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />
    </div>
  );
}
