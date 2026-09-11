"use client";

import { useEffect, useState } from "react";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";

/** One membership prompt for the whole /planner page, replacing the
 * per-section "See what's included" CTA (still shown per-section elsewhere,
 * but suppressed here via PremiumGate's showCta={false}). Runs the same
 * check as PremiumGate and hides itself once the visitor is already
 * unlocked, so paying members don't see a stale "unlock this" prompt. */
export default function PlannerMembershipBanner() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const saved = window.localStorage.getItem(MEMBER_EMAIL_STORAGE_KEY);
        if (!saved) {
          setUnlocked(false);
          return;
        }
        const res = await fetch(`/api/membership?email=${encodeURIComponent(saved)}`);
        const data: { unlocked: boolean } = await res.json();
        setUnlocked(data.unlocked);
      } catch {
        setUnlocked(false);
      }
    });
  }, []);

  if (unlocked !== false) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-600/30 bg-purple-50 p-4 dark:border-purple-400/30 dark:bg-purple-950/30">
      <div>
        <p className="font-semibold">🔒 These tools are Pep-tier</p>
        <p className="text-sm text-black/60 dark:text-white/60">
          Unlock the transfer shortlist, weak links, planner, mini-league simulator, price watch and
          chip analysis with one membership.
        </p>
      </div>
      <a
        href="/pricing"
        className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-purple-700"
      >
        See what&apos;s included →
      </a>
    </div>
  );
}
