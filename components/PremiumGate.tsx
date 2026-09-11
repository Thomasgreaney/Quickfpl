"use client";

import { useCallback, useEffect, useState } from "react";
import { tierUnlocksTopTier, tierUnlocksAnyMembership } from "@/lib/membership";
import { MEMBER_EMAIL_STORAGE_KEY as STORAGE_KEY } from "@/lib/member-storage";

type Status = "idle" | "checking" | "unlocked" | "locked" | "error";

export default function PremiumGate({
  tier = "Pep",
  requireTier = "pep",
  showCta = true,
  children,
}: {
  tier?: string;
  /** "fergie" restricts this gate to the top tier only; "moyes" accepts
   * any active membership (Moyes included), not just Pep/Fergie. */
  requireTier?: "moyes" | "pep" | "fergie";
  /** Set false when a page already shows one membership prompt up top
   * (e.g. /planner) - keeps the per-section blur/lock check but skips the
   * repeated "See what's included" button so it isn't shown 6 times. */
  showCta?: boolean;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("idle");

  const check = useCallback(
    async (candidateEmail: string) => {
      setStatus("checking");
      try {
        const res = await fetch(`/api/membership?email=${encodeURIComponent(candidateEmail)}`);
        const data: { unlocked: boolean; levelName: string | null } = await res.json();
        const passes =
          requireTier === "fergie"
            ? tierUnlocksTopTier(data.levelName)
            : requireTier === "moyes"
              ? tierUnlocksAnyMembership(data.levelName)
              : data.unlocked;
        setStatus(passes ? "unlocked" : "locked");
      } catch {
        setStatus("error");
      }
    },
    [requireTier]
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          check(saved);
        } else {
          setStatus("locked");
        }
      } catch {
        setStatus("locked");
      }
    });
  }, [check]);

  if (status === "unlocked") return <>{children}</>;

  const displayTier = requireTier === "fergie" ? "Fergie" : requireTier === "moyes" ? "Moyes+" : tier;

  return (
    <div className="relative min-h-40 overflow-hidden rounded-lg">
      <div aria-hidden="true" className="pointer-events-none max-h-56 select-none overflow-hidden blur-sm">
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-white via-white/70 to-transparent dark:from-neutral-950 dark:via-neutral-950/70" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="font-semibold">🔒 {displayTier} members only</p>
        {showCta && (
          <a
            href="/pricing"
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-purple-700"
          >
            See what&apos;s included →
          </a>
        )}
        {status === "error" && (
          <p className="text-xs text-red-600 dark:text-red-400">
            Couldn&apos;t check your membership just now — try again in a bit.
          </p>
        )}
      </div>
    </div>
  );
}
