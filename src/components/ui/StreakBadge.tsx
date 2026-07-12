import React from "react";
import { usePractice } from "@/context/PracticeContext";

export const StreakBadge: React.FC = () => {
  const { currentStreak } = usePractice();

  if (currentStreak === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium">
      <span className="font-serif font-bold text-sm tracking-tight">{currentStreak}</span>
      <span className="hidden sm:inline tracking-wide uppercase text-[10px]">day streak</span>
      <span className="sm:hidden text-[10px] font-bold">d</span>
    </div>
  );
};
