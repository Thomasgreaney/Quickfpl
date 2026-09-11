"use client";

import { useState } from "react";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";

// Fill in real £/month figures here once confirmed - shown as a link to
// Buy Me a Coffee in the meantime rather than a guessed number.
const PRICES: Record<"moyes" | "pep" | "fergie", string | null> = {
  moyes: null,
  pep: null,
  fergie: null,
};

const TIERS: {
  key: "moyes" | "pep" | "fergie";
  name: string;
  tagline: string;
  features: string[];
}[] = [
  {
    key: "moyes",
    name: "Moyes",
    tagline: "Say thanks, get the extras",
    features: ["Full gameweek preview write-up"],
  },
  {
    key: "pep",
    name: "Pep",
    tagline: "The main toolkit",
    features: [
      "Everything in Moyes",
      "Chip strategy",
      "Transfer shortlist",
      "Weak links",
      "Transfer planner",
      "Mini-league simulator",
      "Price watch",
    ],
  },
  {
    key: "fergie",
    name: "Fergie",
    tagline: "Everything, no limits",
    features: ["Everything in Pep", "AI Assistant", "Full price history explorer"],
  },
];

type Status = "idle" | "checking" | "unlocked" | "locked" | "error";

/** The one place membership is explained and unlocked - every PremiumGate
 * elsewhere links back here instead of repeating its own email form. */
export default function MembershipComparison() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("checking");
    try {
      const res = await fetch(`/api/membership?email=${encodeURIComponent(trimmed)}`);
      const data: { unlocked: boolean; levelName: string | null } = await res.json();
      if (data.unlocked || data.levelName) {
        try {
          window.localStorage.setItem(MEMBER_EMAIL_STORAGE_KEY, trimmed);
        } catch {
          // storage unavailable - they'll just need to re-enter next visit
        }
        setStatus("unlocked");
        // Every PremiumGate on the page checks localStorage on its own
        // mount - a reload is the simplest way to make them all pick up
        // the newly stored email in one go.
        window.location.reload();
      } else {
        setStatus("locked");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div id="membership" className="scroll-mt-16 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-neutral-900 sm:p-6">
      <h2 className="text-xl font-bold">Membership</h2>
      <p className="mb-4 mt-1 text-sm text-black/60 dark:text-white/60">
        Every locked tool on this page unlocks with one of these. Pick a tier on Buy Me a Coffee, then
        unlock below with the same email.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className="rounded-lg border border-black/10 p-3 dark:border-white/15"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold">{tier.name}</span>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                {PRICES[tier.key] ?? "See on BMC"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{tier.tagline}</p>
            <ul className="mt-2 space-y-1 text-sm text-black/80 dark:text-white/80">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-1.5">
                  <span aria-hidden="true" className="text-purple-600 dark:text-purple-400">
                    +
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href="https://www.buymeacoffee.com/Quickfpl"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#FFDD00] px-3 py-1.5 text-sm font-semibold text-black shadow-sm hover:brightness-95"
        >
          ☕ Become a member
        </a>
        <form onSubmit={unlock} className="flex min-w-0 flex-1 gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Already a member? you@example.com"
            className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={status === "checking"}
            className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {status === "checking" ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
      {status === "locked" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          No active membership found for that email.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t check that just now — try again in a bit.
        </p>
      )}
    </div>
  );
}
