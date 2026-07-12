"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { usePractice } from "@/context/PracticeContext";
import { playSound } from "@/lib/sounds";

const STATIC_HEIGHTS = [10, 22, 14, 34, 20, 40, 16, 28, 12, 24, 18, 32, 14, 20, 10];

export default function LandingPage() {
  const { theme, toggleTheme } = usePractice();
  const [isMounted, setIsMounted] = useState(false);
  const [waveformHeights, setWaveformHeights] = useState(STATIC_HEIGHTS);

  useEffect(() => {
    setIsMounted(true);

    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    // Waveform animation
    let animationFrameId: number;
    let time = 0;

    const updateWave = () => {
      time += 0.05;
      setWaveformHeights((prev) =>
        prev.map((h, i) => {
          const base = STATIC_HEIGHTS[i];
          const waveVal = Math.sin(time + i * 0.6) * Math.cos(time * 0.35 + i * 0.25);
          const delta = waveVal * (base * 0.45);
          return Math.max(4, Math.round(base + delta));
        })
      );
      animationFrameId = requestAnimationFrame(updateWave);
    };

    updateWave();

    return () => {
      cancelAnimationFrame(animationFrameId);
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="font-sans bg-bg text-ink min-h-screen flex flex-col">
      {/* ============ NAV ============ */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 max-w-6xl w-full mx-auto">
        <Link href="/">
          <Logo size="sm" showText={true} />
        </Link>
        <div className="flex items-center gap-3">
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
          <Link
            href="/practice"
            onClick={() => playSound("tap")}
            className="text-sm border border-ink px-4 py-2 rounded-full hover:bg-ink hover:text-bg transition-colors font-medium cursor-pointer"
          >
            Start logging
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="px-6 md:px-12 max-w-6xl w-full mx-auto pt-10 md:pt-20 pb-16 md:pb-28 flex-1 flex flex-col justify-center">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-14 items-center">
          <div className="max-w-xl">
            <p 
              className={`text-muted text-xs mb-5 uppercase tracking-[0.15em] font-semibold transition-all duration-300 ${
                isMounted ? "animate-fade-in-up" : "opacity-0 translate-y-3"
              }`}
            >
              A ledger, not a highlight reel
            </p>
            <h1 
              className={`font-serif text-[2.5rem] leading-[1.08] md:text-[3.75rem] md:leading-[1.05] font-medium tracking-tight transition-all duration-300 ${
                isMounted ? "animate-fade-in-up" : "opacity-0 translate-y-3"
              }`}
              style={{ animationDelay: "150ms" }}
            >
              Nobody sees the
              <br />
              <span className="text-accent">4am practice.</span>
              <br />
              Now there&rsquo;s proof it happened.
            </h1>
            <p 
              className={`text-muted text-base md:text-lg mt-7 max-w-md leading-relaxed transition-all duration-300 ${
                isMounted ? "animate-fade-in-up" : "opacity-0 translate-y-3"
              }`}
              style={{ animationDelay: "300ms" }}
            >
              Log every session. Get honest, specific feedback, spoken back
              to you. Build a streak that&rsquo;s verified, timestamped, and
              yours, long after the highlight reel is forgotten.
            </p>

            <div 
              className={`flex flex-col sm:flex-row gap-3 mt-9 transition-all duration-300 ${
                isMounted ? "animate-fade-in-up" : "opacity-0 translate-y-3"
              }`}
              style={{ animationDelay: "450ms" }}
            >
              <Link
                href="/practice"
                onClick={() => playSound("tap")}
                className="bg-accent text-bg text-center px-7 py-3.5 rounded-full font-medium hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Log your first session
              </Link>
              <a
                href="#how"
                onClick={() => playSound("tap")}
                className="border border-border text-center px-7 py-3.5 rounded-full font-medium hover:border-ink transition-colors cursor-pointer"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* HERO IMAGE: Unsplash, free for commercial use, no attribution required. */}
          <div 
            className={`relative rounded-2xl overflow-hidden border border-border aspect-[4/5] md:aspect-[3/4] transition-all duration-500 ${
              isMounted ? "animate-fade-in-up" : "opacity-0 translate-y-3"
            }`}
            style={{ animationDelay: "600ms" }}
          >
            <img
              src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80"
              alt="Musician practicing cello alone at night"
              className="w-full h-full object-cover grayscale-[15%] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-ink mix-blend-multiply opacity-[0.06]" />
          </div>
        </div>

        {/* SIGNATURE ELEMENT: waveform-as-proof visual */}
        <div 
          className={`mt-16 md:mt-20 border border-border rounded-2xl bg-card-surface px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 transition-all duration-500 ${
            isMounted ? "animate-fade-in-up" : "opacity-0 translate-y-3"
          }`}
          style={{ animationDelay: "750ms" }}
        >
          <div className="flex items-end gap-[3px] h-14 shrink-0" aria-hidden="true">
            {waveformHeights.map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-accent transition-all duration-75"
                style={{ 
                  height: `${h}px`, 
                  opacity: 0.35 + (h / 40) * 0.65,
                }}
              />
            ))}
          </div>
          <div>
            <p className="text-xs text-muted mb-1 font-mono">Session 19 · Violin</p>
            <p className="text-[1.05rem] leading-snug font-serif italic text-ink">
              &ldquo;Bar 12 again. That&rsquo;s the fourth time this week.
              That&rsquo;s not failure, that&rsquo;s exactly where the work
              is.&rdquo;
            </p>
          </div>
        </div>

        {/* ============ DASHBOARD PREVIEW ============ */}
        <div 
          className="mt-16 md:mt-24 border border-border rounded-2xl bg-card-surface p-6 md:p-8 flex flex-col gap-6 transition-all duration-700 hover:border-accent/40 reveal-on-scroll"
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
            <div>
              <span className="text-[10px] text-accent font-semibold tracking-widest uppercase">Overview</span>
              <h3 className="font-serif text-lg text-ink font-medium">Your Practice Ledger</h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium">
              <span className="font-serif font-bold text-sm">14</span>
              <span className="uppercase text-[9px] tracking-wide">day streak</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mini Heatmap */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] text-muted font-mono uppercase tracking-wider">Practice Frequency</span>
              <div className="grid grid-cols-7 gap-2 w-fit">
                {Array.from({ length: 28 }).map((_, i) => {
                  const hasPractice = [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26].includes(i);
                  return (
                    <span 
                      key={i} 
                      className={`w-3.5 h-3.5 rounded-full transition-all hover:scale-110 duration-200 ${
                        hasPractice ? 'bg-accent' : 'border border-border bg-transparent'
                      }`} 
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Mini Trend Line */}
            <div className="flex flex-col gap-3 justify-between">
              <span className="text-[9px] text-muted font-mono uppercase tracking-wider">Weekly Volume Trend</span>
              <div className="relative w-full h-14 flex items-end">
                <svg viewBox="0 0 200 40" className="w-full h-full stroke-accent fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 10 30 Q 40 25 70 12 T 130 5 T 190 8" />
                  <circle cx="190" cy="8" r="3" className="fill-accent stroke-bg" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="px-6 md:px-12 max-w-6xl w-full mx-auto py-16 md:py-24 border-t border-border reveal-on-scroll">
        <h2 className="font-serif text-2xl md:text-3xl font-medium mb-12">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          <div>
            <p className="text-accent text-xs font-semibold mb-3 uppercase tracking-wider">Log it</p>
            <h3 className="text-lg font-serif font-medium mb-2">Talk through your session</h3>
            <p className="text-muted text-sm leading-relaxed">
              Voice or text, right after you practice. No formatting, no
              performance, showing what actually happened tonight.
            </p>
          </div>
          <div>
            <p className="text-accent text-xs font-semibold mb-3 uppercase tracking-wider">Hear back</p>
            <h3 className="text-lg font-serif font-medium mb-2">Get feedback that knows your history</h3>
            <p className="text-muted text-sm leading-relaxed">
              Specific, spoken feedback that tracks patterns across every
              session, rather than generic encouragement.
            </p>
          </div>
          <div>
            <p className="text-accent text-xs font-semibold mb-3 uppercase tracking-wider">Prove it</p>
            <h3 className="text-lg font-serif font-medium mb-2">Build a verified record</h3>
            <p className="text-muted text-sm leading-relaxed">
              Milestones are timestamped and verifiable: a real record of
              dedication no polished reel can fake.
            </p>
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section
        className="px-6 md:px-12 max-w-6xl w-full mx-auto py-16 md:py-24 border-t border-border reveal-on-scroll"
      >
        <div className="max-w-xl">
          <h2 className="font-serif text-2xl md:text-3xl font-medium mb-4">
            Your practice is already happening.
            <br />
            Start keeping the record.
          </h2>
          <Link
            href="/practice"
            onClick={() => playSound("tap")}
            className="inline-block bg-accent text-bg px-7 py-3.5 rounded-full font-medium hover:bg-accent-hover transition-colors mt-4 cursor-pointer"
          >
            Log your first session
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="px-6 md:px-12 max-w-6xl w-full mx-auto py-8 border-t border-border flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted">
        <span>Proof of Practice</span>
        <span>Built for Brainwave 2026</span>
      </footer>
    </main>
  );
}
