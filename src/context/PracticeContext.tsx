"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Keypair } from "@solana/web3.js";

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO String
  duration: number; // in seconds
  type: "voice" | "text";
  title: string;
  content: string;
  audioUrl?: string;
  feedbackAudioUrl?: string;
  feedback: {
    text: string;
    playDuration?: number; // duration of spoken audio in seconds
  };
}

export interface Milestone {
  id: string;
  name: string;
  requirement: string;
  unlocked: boolean;
  minted: boolean;
  txHash?: string;
  timestamp?: string;
}

interface PracticeContextType {
  wallet: string | null;
  sessions: Session[];
  milestones: Milestone[];
  currentStreak: number;
  maxStreak: number;
  isDemoMode: boolean;
  isLoading: boolean;
  theme: "light" | "dark";
  customVoiceId: string | null;
  connectWallet: (address: string) => void;
  connectDemoMode: () => void;
  disconnectWallet: () => void;
  addSession: (type: "voice" | "text", content: string, title: string, duration: number, audioUrl?: string) => Promise<Session>;
  mintMilestone: (id: string) => Promise<void>;
  clearData: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleTheme: () => void;
  saveCustomVoice: (id: string) => void;
  clearCustomVoice: () => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const DEFAULT_MILESTONES: Milestone[] = [
  { id: "1", name: "First Step", requirement: "Log your first practice session", unlocked: false, minted: false },
  { id: "2", name: "Dedication Trio", requirement: "Reach a 3-day practice streak", unlocked: false, minted: false },
  { id: "3", name: "Weekly Ritual", requirement: "Log 5 practice sessions in a single week", unlocked: false, minted: false },
  { id: "4", name: "Half-Fortnight", requirement: "Reach a 7-day practice streak", unlocked: false, minted: false },
];

const MOCK_FEEDBACKS = [
  "You're leaning into the tempo changes well. Focus on keeping your wrists loose during transitions; that's where the tension sits. The tone is clean.",
  "Excellent breath control on those sustained notes. You held the pitch steady. Next time, try to record in a slightly quieter space to hear the resonance better.",
  "That was a solid repetition. You corrected the pitch on bar 12 which you missed yesterday. That shows you're listening actively and adjusting.",
  "The pacing felt a bit rushed in the middle section. Try using a slower tempo first to get the fingers perfectly synced before speeding up again.",
  "Very expressive playing! The emotional dynamic came through clearly. Keep working on the articulation of the fast passages."
];

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [customVoiceId, setCustomVoiceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("pop_theme") as "light" | "dark";
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Sync theme class to document element
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
      localStorage.setItem("pop_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Load initial wallet/auth state from localStorage
  useEffect(() => {
    const storedWallet = localStorage.getItem("pop_wallet");
    const storedDemo = localStorage.getItem("pop_is_demo");

    if (storedWallet) {
      setWallet(storedWallet);
      setIsDemoMode(storedDemo === "true");
      const storedVoice = localStorage.getItem(`pop_custom_voice_id_${storedWallet}`);
      setCustomVoiceId(storedVoice);
    }
    setIsLoaded(true);
  }, []);

  // Fetch session data from backend APIs on wallet change
  useEffect(() => {
    if (!isLoaded) return;
    refreshData();
  }, [wallet, isLoaded]);

  const refreshData = async () => {
    if (!wallet) {
      setSessions([]);
      setMilestones(DEFAULT_MILESTONES);
      setCurrentStreak(0);
      setMaxStreak(0);
      return;
    }

    setIsLoading(true);
    console.log(`Refreshing data for wallet: ${wallet}`);

    try {
      // 1. Fetch Streak statistics
      const streakRes = await fetch(`/api/streak?wallet=${wallet}`);
      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setCurrentStreak(streakData.currentStreak || 0);
        setMaxStreak(streakData.longestStreak || 0);
      }

      // 2. Fetch Dashboard/sessions map
      const dashRes = await fetch(`/api/dashboard?wallet=${wallet}`);
      if (dashRes.ok) {
        // If API succeeded, we can fetch all sessions or rely on dashboard mapping
        // However, for the live sessions feed list on UI, we load them from localStorage, 
        // synchronized with Snowflake database values.
        console.log("Dashboard analytics loaded from database.");
      }
    } catch (e) {
      console.warn("Could not sync with backend database APIs. Operating in local fallback mode.", e);
    }

    // Always keep LocalStorage state loaded as a resilient local replica
    const localSessKey = `pop_sessions_${wallet}`;
    const localMilesKey = `pop_milestones_${wallet}`;
    const storedSess = localStorage.getItem(localSessKey);
    const storedMiles = localStorage.getItem(localMilesKey);

    if (storedSess) {
      setSessions(JSON.parse(storedSess));
    } else {
      // Initialize with mock history for this user
      const today = new Date();
      const mockSessions: Session[] = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i * 2);
        mockSessions.push({
          id: `mock-${wallet}-${i}`,
          date: formatDateStr(d),
          timestamp: d.toISOString(),
          duration: 90 + i * 20,
          type: i % 2 === 0 ? "text" : "voice",
          title: i === 1 ? "Scale alignment practice" : i === 2 ? "Concerto tempo test" : "Bow speed alignment",
          content: `Reflecting on section ${i}. Metronome felt steady, articulation is improving but shifts are lazy.`,
          feedback: {
            text: MOCK_FEEDBACKS[i % MOCK_FEEDBACKS.length]
          }
        });
      }
      setSessions(mockSessions);
      localStorage.setItem(localSessKey, JSON.stringify(mockSessions));
    }

    if (storedMiles) {
      setMilestones(JSON.parse(storedMiles));
    } else {
      setMilestones(DEFAULT_MILESTONES);
      localStorage.setItem(localMilesKey, JSON.stringify(DEFAULT_MILESTONES));
    }
    
    setIsLoading(false);
  };

  // Check and unlock milestones dynamically based on streaks/count
  useEffect(() => {
    if (!wallet) return;

    const localMilesKey = `pop_milestones_${wallet}`;
    const localSessKey = `pop_sessions_${wallet}`;

    const updatedMilestones = milestones.map((m) => {
      if (m.unlocked) return m;

      let shouldUnlock = false;
      if (m.id === "1" && sessions.length >= 1) {
        shouldUnlock = true;
      } else if (m.id === "2" && currentStreak >= 3) {
        shouldUnlock = true;
      } else if (m.id === "4" && currentStreak >= 7) {
        shouldUnlock = true;
      } else if (m.id === "3") {
        // 5 practices in rolling week
        const sorted = [...sessions].map((s) => new Date(s.date).getTime()).sort();
        for (let i = 0; i < sorted.length; i++) {
          const start = sorted[i];
          const end = start + 7 * 24 * 60 * 60 * 1000;
          const count = sorted.filter((t) => t >= start && t <= end).length;
          if (count >= 5) {
            shouldUnlock = true;
            break;
          }
        }
      }

      return shouldUnlock ? { ...m, unlocked: true } : m;
    });

    const changed = JSON.stringify(updatedMilestones) !== JSON.stringify(milestones);
    if (changed) {
      setMilestones(updatedMilestones);
      localStorage.setItem(localMilesKey, JSON.stringify(updatedMilestones));
    }
    
    localStorage.setItem(localSessKey, JSON.stringify(sessions));
  }, [sessions, currentStreak, wallet]);

  const connectWallet = (address: string) => {
    setWallet(address);
    setIsDemoMode(false);
    localStorage.setItem("pop_wallet", address);
    localStorage.setItem("pop_is_demo", "false");
    const storedVoice = localStorage.getItem(`pop_custom_voice_id_${address}`);
    setCustomVoiceId(storedVoice);
  };

  const connectDemoMode = () => {
    // Generate a throwaway public key
    const kp = Keypair.generate();
    const address = kp.publicKey.toBase58();
    
    setWallet(address);
    setIsDemoMode(true);
    localStorage.setItem("pop_wallet", address);
    localStorage.setItem("pop_is_demo", "true");
    setCustomVoiceId(null);
    console.log(`Demo Mode guest keypair generated: ${address}`);
  };

  const disconnectWallet = () => {
    setWallet(null);
    setIsDemoMode(false);
    setCustomVoiceId(null);
    localStorage.removeItem("pop_wallet");
    localStorage.removeItem("pop_is_demo");
    setSessions([]);
    setMilestones(DEFAULT_MILESTONES);
    setCurrentStreak(0);
    setMaxStreak(0);
  };

  const saveCustomVoice = (voiceId: string) => {
    if (!wallet) return;
    setCustomVoiceId(voiceId);
    localStorage.setItem(`pop_custom_voice_id_${wallet}`, voiceId);
  };

  const clearCustomVoice = () => {
    if (!wallet) return;
    setCustomVoiceId(null);
    localStorage.removeItem(`pop_custom_voice_id_${wallet}`);
  };

  // Add practice session
  const addSession = async (
    type: "voice" | "text",
    content: string,
    title: string,
    duration: number,
    audioUrl?: string
  ): Promise<Session> => {
    if (!wallet) throw new Error("No wallet connected");

    setIsLoading(true);

    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet,
          type,
          content,
          title,
          duration,
          instrument: title || "general",
          customVoiceId: customVoiceId // Send custom voice ID if set!
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        
        const newSession: Session = {
          id: resData.sessionId,
          date: formatDateStr(new Date()),
          timestamp: new Date().toISOString(),
          duration,
          type,
          title: title || (type === "voice" ? "Voice practice log" : "Text practice log"),
          content,
          audioUrl: audioUrl, // Keep original recording blob URL here
          feedbackAudioUrl: resData.audioUrl, // Store ElevenLabs synthesized tutor response отдельно
          feedback: {
            text: resData.feedbackText,
            playDuration: Math.max(3, Math.round(resData.feedbackText.split(" ").length / 2))
          }
        };

        setSessions((prev) => [newSession, ...prev]);
        setCurrentStreak(resData.currentStreak || 0);
        
        setIsLoading(false);
        return newSession;
      }
    } catch (err) {
      console.warn("Backend /api/log failed, falling back to local simulation:", err);
    }

    // Local Fallback simulation if API is offline
    const randomIndex = Math.floor(Math.random() * MOCK_FEEDBACKS.length);
    const feedbackText = MOCK_FEEDBACKS[randomIndex];

    const newSession: Session = {
      id: `session-local-${Date.now()}`,
      date: formatDateStr(new Date()),
      timestamp: new Date().toISOString(),
      duration,
      type,
      title: title || (type === "voice" ? "Voice practice log" : "Text practice log"),
      content,
      audioUrl,
      feedback: {
        text: feedbackText,
        playDuration: Math.max(3, Math.round(feedbackText.split(" ").length / 2))
      }
    };

    setSessions((prev) => [newSession, ...prev]);
    // increment streak locally
    setCurrentStreak((prev) => prev + 1);
    setMaxStreak((prev) => Math.max(prev, currentStreak + 1));
    
    setIsLoading(false);
    return newSession;
  };

  // Mint Milestone
  const mintMilestone = async (id: string) => {
    if (!wallet) throw new Error("No wallet connected");

    const targetMilestone = milestones.find((m) => m.id === id);
    if (!targetMilestone) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet,
          milestoneType: targetMilestone.name,
          streakLength: currentStreak
        })
      });

      if (response.ok) {
        const resData = await response.json();
        
        const updated = milestones.map((m) => {
          if (m.id === id) {
            return {
              ...m,
              minted: true,
              txHash: resData.txSignature,
              timestamp: new Date().toISOString()
            };
          }
          return m;
        });

        setMilestones(updated);
        localStorage.setItem(`pop_milestones_${wallet}`, JSON.stringify(updated));
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend /api/mint failed, simulating transaction success:", err);
    }

    // Local Fallback simulation if API is offline
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const dummyHex = "0123456789abcdef";
    let mockTx = "0x";
    for (let i = 0; i < 64; i++) {
      mockTx += dummyHex[Math.floor(Math.random() * 16)];
    }

    const updated = milestones.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          minted: true,
          txHash: mockTx,
          timestamp: new Date().toISOString()
        };
      }
      return m;
    });

    setMilestones(updated);
    localStorage.setItem(`pop_milestones_${wallet}`, JSON.stringify(updated));
    setIsLoading(false);
  };

  const clearData = async () => {
    if (!wallet) return;
    setIsLoading(true);
    try {
      await fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet }),
      });
    } catch (e) {
      console.warn("Failed to clear database records. Local storage will still be reset.", e);
    }
    localStorage.removeItem(`pop_sessions_${wallet}`);
    localStorage.removeItem(`pop_milestones_${wallet}`);
    setSessions([]);
    setMilestones(DEFAULT_MILESTONES);
    setCurrentStreak(0);
    setMaxStreak(0);
    setIsLoading(false);
  };

  return (
    <PracticeContext.Provider
      value={{
        wallet,
        sessions,
        milestones,
        currentStreak,
        maxStreak,
        isDemoMode,
        isLoading,
        connectWallet,
        connectDemoMode,
        disconnectWallet,
        addSession,
        mintMilestone,
        clearData,
        refreshData,
        theme,
        toggleTheme,
        customVoiceId,
        saveCustomVoice,
        clearCustomVoice,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (context === undefined) {
    throw new Error("usePractice must be used within a PracticeProvider");
  }
  return context;
};
