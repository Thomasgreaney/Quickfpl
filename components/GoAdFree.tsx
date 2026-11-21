"use client";

import { useState } from "react";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";

// Placeholder price - adjust to whatever you actually want to charge.
const PRICE = "£3/mo";

const FEATURES = [
  "Every tool on the site, already free for everyone",
  "Zero ads, anywhere on QuickFPL",
  "The gameweek preview and wrap-up, AI Assistant and price history included",
];

type Status = "idle" | "checking" | "unlocked" | "locked" | "error";

/** Everything on QuickFPL is free - this is the one upsell: pay to stop
 * seeing ads. Anyone with an existing active membership record from the
 * old Moyes/Pep/Fergie tiers is automatically ad-free under this too, no
 * migration needed - the check is just "is there an active record for
 * this email", regardless of which tier it used to be. */
export default function GoAdFree() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("checking");
    try {
      const res = await fetch(`/api/membership?email=${encodeURIComponent(trimmed)}`);
      const data: { adFree: boolean } = await res.json();
      if (data.adFree) {
        try {
          window.localStorage.setItem(MEMBER_EMAIL_STORAGE_KEY, trimmed);
        } catch {
          // storage unavailable - they'll just need to re-enter next visit
        }
        setStatus("unlocked");
        // AdSlot checks localStorage on its own mount - a reload is the
        // simplest way to make every ad slot on the page pick this up.
        window.location.reload();
      } else {
        setStatus("locked");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div id="go-ad-free" className="card scroll-mt-16 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-700 to-fuchsia-600 px-4 py-4 text-white sm:px-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Go ad-free</h2>
          <span className="text-lg font-semibold">{PRICE}</span>
        </div>
        <p className="text-sm text-white/85">Every tool is already free. This just removes the ads.</p>
      </div>

      <div className="p-4 sm:p-6">
        <ul className="space-y-1.5 text-sm text-black/80 dark:text-white/80">
          {FEATURES.map((f) => (
            <li key={f} className="flex gap-1.5">
              <span aria-hidden="true" className="text-purple-600 dark:text-purple-400">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/10 pt-5 dark:border-white/10">
          <a
            href="https://www.buymeacoffee.com/Quickfpl"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary whitespace-nowrap"
          >
            Go ad-free
          </a>
          <form onSubmit={unlock} className="flex min-w-0 flex-1 gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Already paid? you@example.com"
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900"
            />
            <button type="submit" disabled={status === "checking"} className="btn-secondary">
              {status === "checking" ? "Checking…" : "Unlock"}
            </button>
          </form>
        </div>
        {status === "locked" && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            No active payment found for that email.
          </p>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t check that just now — try again in a bit.
          </p>
        )}
      </div>
    </div>
  );
}
