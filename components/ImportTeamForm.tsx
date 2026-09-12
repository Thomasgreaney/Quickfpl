"use client";

import { useState } from "react";
import type { Position } from "@/lib/fpl-types";

interface ImportResponse {
  teamName: string;
  managerName: string;
  squad: Record<Position, number[]>;
  bench: number[];
}

/** Lets a visitor pull their real FPL squad by team ID instead of building
 * one by hand. Free and ungated - it's the main friction-remover for new
 * visitors, not a premium tool. */
export default function ImportTeamForm({
  onImported,
}: {
  onImported: (squad: Record<Position, number[]>, bench: number[]) => void;
}) {
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(teamId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid team ID - the number in your team's URL on the FPL site.");
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/import-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: id }),
      });
      const data: ImportResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't import that team just now - try again in a bit.");
        return;
      }
      onImported(data.squad, data.bench);
      setSuccess(`Imported ${data.teamName} (${data.managerName}).`);
      setTeamId("");
    } catch {
      setError("Couldn't import that team just now - try again in a bit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-3 rounded-lg border border-purple-600/30 bg-purple-50 px-3 py-2.5 dark:border-purple-400/30 dark:bg-purple-950/30">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <p className="mr-1 whitespace-nowrap text-sm font-semibold text-purple-900 dark:text-purple-200">
          Already play FPL?
        </p>
        <input
          type="text"
          inputMode="numeric"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Your team ID"
          disabled={loading}
          className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-purple-500 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading || !teamId.trim()}
          className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import my team"}
        </button>
      </form>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : success ? (
        <p className="mt-1.5 text-xs text-green-700 dark:text-green-400">{success}</p>
      ) : (
        <p className="mt-1.5 text-xs text-purple-800/70 dark:text-purple-300/70">
          The number in your team&apos;s URL on the official FPL site - pulls your real squad
          instead of building it by hand.
        </p>
      )}
    </div>
  );
}
