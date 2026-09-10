"use client";

import { useEffect, useState } from "react";
import type { FixtureRun, Player } from "@/lib/fpl-types";
import { buildWeakLinks } from "@/lib/weaklinks";
import { SQUAD_UPDATED_EVENT, readSquadPlayerIds } from "@/lib/squad-storage";
import PlayerPhoto from "./PlayerPhoto";
import FixtureChips from "./FixtureChips";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

export default function WeakLinks({
  players,
  fixturesByTeam,
}: {
  players: Player[];
  fixturesByTeam: Record<number, FixtureRun[]>;
}) {
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function reload() {
      setSquadIds(readSquadPlayerIds());
    }
    Promise.resolve().then(() => {
      reload();
      setLoaded(true);
    });
    window.addEventListener(SQUAD_UPDATED_EVENT, reload);
    return () => window.removeEventListener(SQUAD_UPDATED_EVENT, reload);
  }, []);

  if (!loaded) return null;

  if (squadIds.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        Save a squad in &quot;My team&quot; above and we&apos;ll flag anyone worth worrying about.
      </p>
    );
  }

  const weakLinks = buildWeakLinks(players, fixturesByTeam, new Set(squadIds));

  if (weakLinks.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        Nothing to flag - your squad&apos;s in decent shape right now.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {weakLinks.map(({ player, isInjuryConcern, reason }) => (
        <li
          key={player.id}
          className="flex gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900"
        >
          <PlayerPhoto photoId={player.photoId} name={player.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold">
                {player.name}
                {isInjuryConcern && (
                  <span className="rounded bg-red-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-400/15 dark:text-red-400">
                    Injury / doubt
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-sm tabular-nums">{fmtMoney(player.price)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="text-xs text-black/50 dark:text-white/50">
                {player.teamShort} · form {player.form.toFixed(1)}
              </span>
              <FixtureChips fixtures={fixturesByTeam[player.teamId]} />
            </div>
            <p className="mt-1 text-sm text-black/80 dark:text-white/80">{reason}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
