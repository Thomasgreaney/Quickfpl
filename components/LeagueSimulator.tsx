"use client";

import { useEffect, useState } from "react";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";
import type { SimulatedEntry } from "@/lib/league-simulator";

interface SimulatorResponse {
  leagueName: string;
  totalEntries: number;
  shownEntries: number;
  gameweeksPlayed: number;
  entries: SimulatedEntry[];
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function LeagueSimulator() {
  const [email, setEmail] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulatorResponse | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        setEmail(window.localStorage.getItem(MEMBER_EMAIL_STORAGE_KEY));
      } catch {
        setEmail(null);
      }
    });
  }, []);

  async function runSimulation(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(leagueId.trim());
    if (!email || !Number.isInteger(id) || id <= 0) {
      setError("Enter a valid league ID - the number in your league's URL on the FPL site.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/league-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, leagueId: id }),
      });
      const data: SimulatorResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't run that simulation just now - try again in a bit.");
        return;
      }
      setResult(data);
    } catch {
      setError("Couldn't run that simulation just now - try again in a bit.");
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

  return (
    <div>
      <form onSubmit={runSimulation} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          placeholder="Mini-league ID (from the league's URL)"
          disabled={loading}
          className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading || !leagueId.trim()}
          className="whitespace-nowrap rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Simulating…" : "Simulate"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="font-semibold">{result.leagueName}</h3>
            <span className="text-xs text-black/40 dark:text-white/40">
              {result.shownEntries < result.totalEntries
                ? `Top ${result.shownEntries} of ${result.totalEntries} entries · ${result.gameweeksPlayed} GWs played`
                : `${result.shownEntries} entries · ${result.gameweeksPlayed} GWs played`}
            </span>
          </div>

          <ul className="space-y-2">
            {result.entries.map((entry, i) => (
              <li
                key={entry.entryId}
                className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-black/40 dark:text-white/40">#{i + 1}</span>
                      <span className="truncate font-semibold">{entry.teamName}</span>
                    </div>
                    <div className="text-xs text-black/50 dark:text-white/50">
                      {entry.managerName} · currently rank {entry.currentRank}, {entry.currentTotal} pts
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-3 text-right">
                    <div>
                      <div className="text-sm font-bold tabular-nums text-purple-700 dark:text-purple-400">
                        {pct(entry.winProbability)}
                      </div>
                      <div className="text-[10px] text-black/40 dark:text-white/40">win</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold tabular-nums">{pct(entry.top3Probability)}</div>
                      <div className="text-[10px] text-black/40 dark:text-white/40">top 3</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold tabular-nums">{entry.avgFinalPosition.toFixed(1)}</div>
                      <div className="text-[10px] text-black/40 dark:text-white/40">avg pos</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
