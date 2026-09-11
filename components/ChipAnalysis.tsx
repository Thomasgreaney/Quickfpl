"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FplRawFixture, Player, TeamRef } from "@/lib/fpl-types";
import { analyzeGameweeks, recommendChips, CHIP_LABELS, type ChipType } from "@/lib/chips";
import { SQUAD_UPDATED_EVENT, readSquadPlayerIds } from "@/lib/squad-storage";
import { CHIPS_USED_UPDATED_EVENT, readUsedChips } from "@/lib/chip-tracker-storage";

const ALL_CHIPS: ChipType[] = ["wildcard", "freehit", "benchboost", "triplecaptain"];

/** Pep-tier chip-timing analysis. Reads which chips are left from the free
 * tracker on /squad (ChipTracker) rather than owning that state itself. */
export default function ChipAnalysis({
  players,
  fixtures,
  teams,
}: {
  players: Player[];
  fixtures: FplRawFixture[];
  teams: TeamRef[];
}) {
  const [remaining, setRemaining] = useState<Set<ChipType>>(new Set(ALL_CHIPS));
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function reloadSquad() {
      setSquadIds(readSquadPlayerIds());
    }
    function reloadChips() {
      const used = readUsedChips();
      setRemaining(new Set(ALL_CHIPS.filter((c) => !used.has(c))));
    }
    // Initial read, deferred so server and first client render match
    // (localStorage doesn't exist on the server).
    Promise.resolve().then(() => {
      reloadSquad();
      reloadChips();
      setLoaded(true);
    });
    window.addEventListener(SQUAD_UPDATED_EVENT, reloadSquad);
    window.addEventListener(CHIPS_USED_UPDATED_EVENT, reloadChips);
    return () => {
      window.removeEventListener(SQUAD_UPDATED_EVENT, reloadSquad);
      window.removeEventListener(CHIPS_USED_UPDATED_EVENT, reloadChips);
    };
  }, []);

  const byId = new Map(players.map((p) => [p.id, p]));
  const squadPlayers = squadIds.map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));

  const analysis = analyzeGameweeks(fixtures, teams);
  const advice = recommendChips([...remaining], analysis, teams, squadPlayers, players);

  return (
    <div>
      <p className="mb-2 text-sm text-black/60 dark:text-white/60">
        Ranked from real fixture data{squadPlayers.length > 0 ? " and your saved squad" : ""} — tick
        off which chips you&apos;ve used on the{" "}
        <Link href="/squad" className="underline underline-offset-2 hover:text-purple-600 dark:hover:text-purple-400">
          Squad
        </Link>{" "}
        page and this updates to match.
      </p>
      <p className="mb-4 text-xs text-black/50 dark:text-white/50">
        Reminder: this half&apos;s chips expire at the Gameweek 19 deadline (New Year) — a fresh set
        unlocks for the second half of the season. That&apos;s real deadline pressure worth weighing
        against waiting for the &quot;perfect&quot; gameweek.
      </p>

      {!loaded ? null : advice.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          Mark at least one chip as available on the Squad page to get advice.
        </p>
      ) : (
        <div className="space-y-4">
          {advice.map((a) => (
            <div
              key={a.chip}
              className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900"
            >
              <h4 className="font-semibold">{CHIP_LABELS[a.chip]}</h4>

              {a.candidates.length === 0 ? (
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">{a.emptyReason}</p>
              ) : (
                <ol className="mt-2 space-y-2">
                  {a.candidates.map((c, i) => (
                    <li key={i} className="rounded-md bg-black/[.03] p-2.5 dark:bg-white/[.05]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {i === 0 ? "Best" : `Option ${i + 1}`} · Gameweek {c.event}
                        </span>
                        {c.suggestedPlayerName && (
                          <span className="whitespace-nowrap rounded bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {c.suggestedPlayerName}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-black/70 dark:text-white/70">{c.reason}</p>
                    </li>
                  ))}
                </ol>
              )}

              <p className="mt-2.5 border-t border-black/10 pt-2.5 text-xs text-black/50 dark:border-white/10 dark:text-white/50">
                {a.strategyNote}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
