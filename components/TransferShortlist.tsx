"use client";

import { useEffect, useState } from "react";
import type { FixtureRun, Player, Position } from "@/lib/fpl-types";
import { buildShortlist, buildShortlistVerdict } from "@/lib/shortlist";
import { SQUAD_UPDATED_EVENT, readSquadPlayerIds } from "@/lib/squad-storage";
import PlayerPhoto from "./PlayerPhoto";
import FixtureChips from "./FixtureChips";

const POSITIONS: Position[] = ["GKP", "DEF", "MID", "FWD"];

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

export default function TransferShortlist({
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

  const byId = new Map(players.map((p) => [p.id, p]));
  const squadByPosition: Record<Position, Player[]> = { GKP: [], DEF: [], MID: [], FWD: [] };
  for (const id of squadIds) {
    const p = byId.get(id);
    if (p) squadByPosition[p.position].push(p);
  }

  const shortlist = buildShortlist(players, fixturesByTeam, new Set(squadIds));

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {POSITIONS.map((position) => (
        <section key={position}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
            {position}
          </h3>
          {shortlist[position].length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50">Nothing worth flagging right now.</p>
          ) : (
            <ul className="space-y-2">
              {shortlist[position].map((entry) => {
                const { player, isDifferential, reason } = entry;
                const verdict = buildShortlistVerdict(entry, squadByPosition[position], fixturesByTeam);
                return (
                  <li
                    key={player.id}
                    className="flex gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900"
                  >
                    <PlayerPhoto photoId={player.photoId} name={player.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-semibold">
                          {player.name}
                          {isDifferential && (
                            <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/60 dark:bg-white/15 dark:text-white/70">
                              Differential
                            </span>
                          )}
                        </span>
                        <span className="whitespace-nowrap text-sm tabular-nums">{fmtMoney(player.price)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="text-xs text-black/50 dark:text-white/50">
                          {player.teamShort} · {player.ownership.toFixed(1)}% owned · form {player.form.toFixed(1)}
                        </span>
                        <FixtureChips fixtures={fixturesByTeam[player.teamId]} />
                      </div>
                      <p className="mt-1 text-sm text-black/80 dark:text-white/80">{reason}</p>
                      <p
                        className={`mt-1.5 text-sm font-semibold ${
                          verdict.confident
                            ? "text-purple-700 dark:text-purple-400"
                            : "text-black/60 dark:text-white/60"
                        }`}
                      >
                        {verdict.confident && "→ "}
                        {verdict.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
