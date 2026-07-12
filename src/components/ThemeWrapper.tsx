"use client";

import React from "react";
import { usePractice } from "@/context/PracticeContext";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = usePractice();
  
  return (
    <div className={`${theme} min-h-screen bg-bg text-ink flex flex-col transition-colors duration-300`}>
      {children}
    </div>
  );
}
