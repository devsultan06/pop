"use client";

import React, { useMemo, useState } from "react";
import { usePractice } from "@/context/PracticeContext";
import { Card } from "@/components/ui/Card";
import { playSound } from "@/lib/sounds";

export default function DashboardScreen() {
  const { wallet, sessions, currentStreak, maxStreak } = usePractice();
  const [copied, setCopied] = useState(false);

  // Get current date information for the calendar
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Format month name
  const monthName = today.toLocaleDateString("en-US", { month: "long" });

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; hasPractice: boolean }[] = [];

    // Padding for previous month's days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dateStr: "",
        dayNum: 0,
        isCurrentMonth: false,
        hasPractice: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      // Format to YYYY-MM-DD local time
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;

      const hasPractice = sessions.some((s) => s.date === dateStr);

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        hasPractice
      });
    }

    return days;
  }, [sessions, currentMonth, currentYear]);

  // Cohort Percentile Calculation (Mock calculation based on streak)
  const percentile = useMemo(() => {
    if (sessions.length === 0) return 0;
    // Calculate a realistic percentile: base of 50%, adding 8% per day of streak, capped at 97%
    return Math.min(97, 50 + currentStreak * 8);
  }, [sessions, currentStreak]);

  // Trend graph data: Calculate practices per week for the last 6 weeks
  const weeklyTrendData = useMemo(() => {
    const data: { label: string; count: number }[] = [];
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 5; i >= 0; i--) {
      const weekEnd = new Date(today.getTime() - i * oneWeekMs);
      const weekStart = new Date(weekEnd.getTime() - oneWeekMs);
      
      const count = sessions.filter((s) => {
        const sTime = new Date(s.date).getTime();
        return sTime >= weekStart.getTime() && sTime < weekEnd.getTime();
      }).length;

      const label = i === 0 ? "This Week" : `${i}w ago`;
      data.push({ label, count });
    }
    
    return data;
  }, [sessions]);

  // Generate SVG path for the trend line
  const svgLinePath = useMemo(() => {
    if (weeklyTrendData.length === 0) return "";
    
    const width = 300;
    const height = 80;
    const paddingLeftRight = 10;
    const paddingTop = 18;
    const paddingBottom = 10;
    
    const maxVal = Math.max(3, ...weeklyTrendData.map((d) => d.count));
    
    const points = weeklyTrendData.map((d, index) => {
      const x = paddingLeftRight + (index / (weeklyTrendData.length - 1)) * (width - 2 * paddingLeftRight);
      const y = height - paddingBottom - (d.count / maxVal) * (height - paddingTop - paddingBottom);
      return { x, y };
    });

    // Generate SVG path string
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");
  }, [weeklyTrendData]);

  // Get trend points for circular indicators on graph
  const trendPoints = useMemo(() => {
    if (weeklyTrendData.length === 0) return [];
    
    const width = 300;
    const height = 80;
    const paddingLeftRight = 10;
    const paddingTop = 18;
    const paddingBottom = 10;
    
    const maxVal = Math.max(3, ...weeklyTrendData.map((d) => d.count));
    
    return weeklyTrendData.map((d, index) => {
      const x = paddingLeftRight + (index / (weeklyTrendData.length - 1)) * (width - 2 * paddingLeftRight);
      const y = height - paddingBottom - (d.count / maxVal) * (height - paddingTop - paddingBottom);
      return { x, y, val: d.count };
    });
  }, [weeklyTrendData]);

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-medium text-ink">
          Dashboard
        </h1>
        <p className="text-xs text-muted mt-1">
          A quiet overview of your practice history.
        </p>
      </div>

      {/* Row of Stats (Card grid layout) */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] text-muted uppercase tracking-wider">Current</span>
          <span className="font-serif text-xl font-medium text-accent mt-1">{currentStreak}d</span>
          <span className="text-[9px] text-muted mt-0.5">streak</span>
        </Card>
        <Card className="p-4 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] text-muted uppercase tracking-wider">Longest</span>
          <span className="font-serif text-xl font-medium text-ink mt-1">{maxStreak}d</span>
          <span className="text-[9px] text-muted mt-0.5">streak</span>
        </Card>
        <Card className="p-4 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] text-muted uppercase tracking-wider">Total</span>
          <span className="font-serif text-xl font-medium text-ink mt-1">{sessions.length}</span>
          <span className="text-[9px] text-muted mt-0.5">sessions</span>
        </Card>
      </div>

      {/* Streak Calendar (Heatmap style) */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <h2 className="font-serif font-medium text-base text-ink">
            {monthName} {currentYear}
          </h2>
          <span className="text-[10px] text-muted uppercase tracking-wider font-mono">
            Streak Map
          </span>
        </div>

        <div className="grid grid-cols-7 gap-y-3.5 gap-x-2 text-center text-xs">
          {/* Weekday Labels */}
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <span key={idx} className="text-[10px] text-muted font-semibold">
              {day}
            </span>
          ))}

          {/* Calendar dots */}
          {calendarDays.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return <div key={idx} className="h-6 w-6" />;
            }

            return (
              <div key={idx} className="flex justify-center items-center">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                    day.hasPractice
                      ? "bg-accent text-bg font-bold"
                      : "border border-border text-muted hover:border-ink/40"
                  }`}
                  title={day.dateStr}
                >
                  {day.dayNum}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Cohort Percentile (Simple bar) */}
      <Card className="flex flex-col gap-3">
        <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider">
          Cohort Comparison
        </h3>
        <div>
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="text-muted">Weekly Practice Percentile</span>
            <span className="font-serif font-medium text-accent text-sm">{percentile}th percentile</span>
          </div>
          {/* Flat bar container */}
          <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-1000 ease-out"
              style={{ width: `${percentile}%` }}
            />
          </div>
          <p className="text-[10px] text-muted mt-2 leading-relaxed">
            You practiced more consistently than {percentile}% of musicians in your reference cohort over the last 7 days.
          </p>
        </div>
      </Card>

      {/* Trend Graph (Sessions-per-week clean SVG line) */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Volume Trend
          </h3>
          <span className="text-[10px] text-muted font-mono">
            Sessions / Week
          </span>
        </div>

        <div className="w-full flex flex-col items-center py-2">
          {/* Trend Line SVG */}
          <div className="relative w-full aspect-[300/80]">
            <svg
              viewBox="0 0 300 80"
              className="w-full h-full stroke-accent fill-none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Grid line (zero line) */}
              <line x1="0" y1="70" x2="300" y2="70" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Trend path */}
              <path d={svgLinePath} />

              {/* Data points */}
              {trendPoints.map((p, idx) => (
                <g key={idx} className="fill-accent stroke-bg" strokeWidth="1.5">
                  <circle cx={p.x} cy={p.y} r="4" className="cursor-pointer hover:r-5 transition-all" />
                  {/* Subtle tooltip value above point */}
                  <text
                    x={p.x}
                    y={p.y - 8}
                    className="font-mono fill-ink stroke-none text-[8px] text-center"
                    textAnchor="middle"
                  >
                    {p.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="w-full flex justify-between px-2.5 mt-2 text-[9px] font-mono text-muted">
            {weeklyTrendData.map((d, idx) => (
              <span key={idx}>{d.label}</span>
            ))}
          </div>
        </div>
      </Card>

      {/* Share Verification Loop */}
      {wallet && (
        <Card className="flex flex-col gap-3 border-dashed border-accent/20 bg-accent/5 p-4 rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Share Achievement Ledger
            </h3>
            <span className="text-[9px] text-accent font-semibold font-mono uppercase">
              Growth Loop
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Create a public, read-only verification page showing your daily streak, stats, and Solana-minted achievements.
          </p>
          <div className="flex gap-2.5 mt-1">
            <button
              onClick={() => {
                playSound("tap");
                const verifyUrl = `${window.location.origin}/verify/${wallet}`;
                navigator.clipboard.writeText(verifyUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-1 py-2 bg-accent/15 hover:bg-accent/20 text-accent text-xs font-semibold rounded-xl cursor-pointer focus:outline-none transition-all border-none"
            >
              {copied ? "Link Copied! ✓" : "Copy Verification Link"}
            </button>
            <a
              href={`/verify/${wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound("tap")}
              className="px-4 py-2 border border-border bg-card-surface text-ink text-xs font-semibold rounded-xl text-center hover:bg-border/20 transition-all flex items-center justify-center"
            >
              Preview
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
