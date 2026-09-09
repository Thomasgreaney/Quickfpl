"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "quickfpl-member-email";

type Status = "idle" | "checking" | "unlocked" | "locked" | "error";

export default function PremiumGate({
  tier = "Pep",
  children,
}: {
  tier?: string;
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setEmail(saved);
          check(saved);
        }
      } catch {
        // ignore corrupt/unavailable storage
      }
    });
  }, []);

  async function check(candidateEmail: string) {
    setStatus("checking");
    try {
      const res = await fetch(`/api/membership?email=${encodeURIComponent(candidateEmail)}`);
      const data: { unlocked: boolean } = await res.json();
      if (data.unlocked) {
        setStatus("unlocked");
        try {
          window.localStorage.setItem(STORAGE_KEY, candidateEmail);
        } catch {
          // storage unavailable - they'll just need to re-enter next visit
        }
      } else {
        setStatus("locked");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "unlocked") return <>{children}</>;

  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-black/[.02] p-6 text-center dark:border-white/20 dark:bg-white/[.03]">
      <p className="font-semibold">🔒 {tier} members only</p>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Already a Pep or Fergie member? Enter the email you used on Buy Me a Coffee.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) check(email.trim());
        }}
        className="mx-auto mt-3 flex max-w-xs gap-2"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
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
      {status === "locked" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          No active Pep/Fergie membership found for that email.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t check that just now — try again in a bit.
        </p>
      )}
      <a
        href="https://www.buymeacoffee.com/Quickfpl"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#FFDD00] px-3 py-1.5 text-sm font-semibold text-black shadow-sm hover:brightness-95"
      >
        ☕ Become a member
      </a>
    </div>
  );
}
