"use client";

import { useState } from "react";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";

const PRICES: Record<"moyes" | "pep" | "fergie", string | null> = {
  moyes: "£2/mo",
  pep: "£5/mo",
  fergie: "£7/mo",
};

const TIERS: {
  key: "moyes" | "pep" | "fergie";
  name: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  accent: string;
}[] = [
  {
    key: "moyes",
    name: "Moyes",
    tagline: "Say thanks, get the extras",
    features: ["Full gameweek preview write-up"],
    accent: "from-slate-500 to-slate-400",
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
    highlight: true,
    accent: "from-purple-700 to-fuchsia-600",
  },
  {
    key: "fergie",
    name: "Fergie",
    tagline: "Everything, no limits",
    features: ["Everything in Pep", "AI Assistant", "Full price history explorer"],
    accent: "from-amber-500 to-amber-400",
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
    <div id="membership" className="card scroll-mt-16 p-4 sm:p-6">
      <h2 className="text-xl font-bold">Membership</h2>
      <p className="mb-5 mt-1 text-sm text-black/60 dark:text-white/60">
        Every locked tool on this page unlocks with one of these. Pick a tier on Buy Me a Coffee, then
        unlock below with the same email.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 sm:items-start">
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className={`overflow-hidden rounded-xl border ${
              tier.highlight
                ? "border-purple-600/40 shadow-md shadow-purple-600/10 sm:-mt-2 sm:mb-2"
                : "border-black/10 dark:border-white/15"
            }`}
          >
            <div className={`bg-gradient-to-r ${tier.accent} px-4 py-2.5 text-white`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{tier.name}</span>
                <span className="text-sm font-semibold">{PRICES[tier.key] ?? "See on BMC"}</span>
              </div>
              <p className="text-xs text-white/80">{tier.tagline}</p>
            </div>
            {tier.highlight && (
              <p className="bg-purple-50 px-4 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                Most popular
              </p>
            )}
            <ul className="space-y-1.5 bg-white p-4 text-sm text-black/80 dark:bg-neutral-900 dark:text-white/80">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-1.5">
                  <span aria-hidden="true" className="text-purple-600 dark:text-purple-400">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/10 pt-5 dark:border-white/10">
        <a
          href="https://www.buymeacoffee.com/Quickfpl"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#FFDD00] px-4 py-2 text-sm font-semibold text-black shadow-sm hover:brightness-95"
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
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900"
          />
          <button type="submit" disabled={status === "checking"} className="btn-primary">
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
