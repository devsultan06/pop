"use client";

import React from "react";
import { usePractice } from "@/context/PracticeContext";
import { MilestoneCard } from "@/components/ui/MilestoneCard";
import { Button } from "@/components/ui/Button";

export default function MilestonesScreen() {
  const { milestones, clearData } = usePractice();

  // Sort milestones: unlocked & unminted first, then minted, then locked
  const sortedMilestones = React.useMemo(() => {
    return [...milestones].sort((a, b) => {
      if (a.unlocked && !a.minted && (!b.unlocked || b.minted)) return -1;
      if (b.unlocked && !b.minted && (!a.unlocked || a.minted)) return 1;
      if (a.unlocked && b.unlocked) {
        if (a.minted && !b.minted) return 1;
        if (!a.minted && b.minted) return -1;
      }
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
    });
  }, [milestones]);

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-medium text-ink">
          On-Chain Milestones
        </h1>
        <p className="text-xs text-muted mt-1">
          Mint cryptographic proofs of your dedication to the ledger.
        </p>
      </div>

      {/* Milestone Cards list */}
      <div className="flex flex-col gap-4">
        {sortedMilestones.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))}
      </div>

      {/* Clear/Reset Demo block (quiet secondary button) */}
      <div className="mt-8 pt-6 border-t border-border/80 flex flex-col items-center gap-2">
        <p className="text-[10px] text-muted text-center max-w-[280px] leading-relaxed">
          Need to reset the application state to showcase the first-run experience?
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Reset all logged practice sessions, streaks, and milestones back to defaults?")) {
              clearData();
              window.location.reload();
            }
          }}
          className="text-xs py-2 hover:bg-accent/5 hover:text-accent border border-dashed border-border hover:border-accent/20 cursor-pointer"
        >
          Reset Demo State
        </Button>
      </div>
    </div>
  );
}
