"use client";

import { useEffect, useState } from "react";
import type { FplRawFixture, Player, TeamRef } from "@/lib/fpl-types";
import { analyzeGameweeks, recommendChips, CHIP_LABELS, type ChipType } from "@/lib/chips";
import { SQUAD_UPDATED_EVENT, readSquadPlayerIds } from "@/lib/squad-storage";

const ALL_CHIPS: ChipType[] = ["wildcard", "freehit", "benchboost", "triplecaptain"];

export default function ChipStrategy({
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
    function reload() {
      setSquadIds(readSquadPlayerIds());
    }
    // Initial read, deferred so server and first client render match
    // (localStorage doesn't exist on the server).
    Promise.resolve().then(() => {
      reload();
      setLoaded(true);
    });
    // The squad builder lives in a separate component; listen for its
    // updates so this panel stays in sync without a page reload.
    window.addEventListener(SQUAD_UPDATED_EVENT, reload);
    return () => window.removeEventListener(SQUAD_UPDATED_EVENT, reload);
  }, []);

  function toggle(chip: ChipType) {
    setRemaining((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }

  const byId = new Map(players.map((p) => [p.id, p]));
  const squadTeamIds = squadIds
    .map((id) => byId.get(id)?.teamId)
    .filter((id): id is number => id !== undefined);

  const analysis = analyzeGameweeks(fixtures, teams);
  const advice = recommendChips([...remaining], analysis, squadTeamIds);

  return (
    <div>
      <p className="mb-3 text-sm text-black/60 dark:text-white/60">
        Tick off the chips you&apos;ve already used. We&apos;ll work out when to play what&apos;s left,
        from real fixture data
        {squadIds.length > 0
          ? " and your saved squad."
          : " — build your squad in the My Team section above for advice tailored to your actual team."}
      </p>

      <div className="mb-2 flex flex-wrap gap-2">
        {ALL_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => toggle(chip)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              remaining.has(chip)
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-black/10 bg-black/[.03] text-black/40 line-through dark:border-white/15 dark:bg-white/[.05] dark:text-white/40"
            }`}
          >
            {CHIP_LABELS[chip]}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-black/40 dark:text-white/40">
        Highlighted = still available. Tap one to mark it as used.
      </p>

      {!loaded ? null : advice.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          Mark at least one chip as available to get advice.
        </p>
      ) : (
        <ul className="space-y-2">
          {advice.map((a) => (
            <li
              key={a.chip}
              className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{CHIP_LABELS[a.chip]}</span>
                {a.bestEvent !== null && (
                  <span className="whitespace-nowrap rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    Gameweek {a.bestEvent}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">{a.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
