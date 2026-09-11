"use client";

import { useEffect, useState } from "react";
import { CHIP_LABELS, type ChipType } from "@/lib/chips";
import { readUsedChips, writeUsedChips } from "@/lib/chip-tracker-storage";
import Link from "next/link";

const ALL_CHIPS: ChipType[] = ["wildcard", "freehit", "benchboost", "triplecaptain"];

/** Free chip-used tracker. Lives on /squad; the paid chip-timing analysis
 * that reads this same state lives on /planner (ChipAnalysis). */
export default function ChipTracker() {
  const [used, setUsed] = useState<Set<ChipType>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setUsed(readUsedChips());
      setLoaded(true);
    });
  }, []);

  function toggle(chip: ChipType) {
    setUsed((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      writeUsedChips(next);
      return next;
    });
  }

  if (!loaded) return null;

  return (
    <div>
      <p className="mb-3 text-sm text-black/60 dark:text-white/60">
        Tick off the chips you&apos;ve already used. We&apos;ll use this to power the chip-timing
        analysis on the{" "}
        <Link href="/planner" className="underline underline-offset-2 hover:text-purple-600 dark:hover:text-purple-400">
          Planner
        </Link>{" "}
        page.
      </p>

      <div className="mb-2 flex flex-wrap gap-2">
        {ALL_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => toggle(chip)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              !used.has(chip)
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-black/10 bg-black/[.03] text-black/40 line-through dark:border-white/15 dark:bg-white/[.05] dark:text-white/40"
            }`}
          >
            {CHIP_LABELS[chip]}
          </button>
        ))}
      </div>
      <p className="text-xs text-black/40 dark:text-white/40">
        Highlighted = still available. Tap one to mark it as used.
      </p>
    </div>
  );
}
