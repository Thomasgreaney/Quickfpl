"use client";

import { useEffect, useState } from "react";
import type { FplRawFixture, Player, TeamRef } from "@/lib/fpl-types";
import { analyzeGameweeks } from "@/lib/chips";
import { buildPlanner, findChipWindows, type WeekOutlook } from "@/lib/transfer-planner";
import { SQUAD_UPDATED_EVENT, readSquadPlayerIds } from "@/lib/squad-storage";
import PlayerPhoto from "./PlayerPhoto";

const MAX_ROWS = 6;

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function weekClass(w: WeekOutlook): string {
  if (w.difficulty === null) return "bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40";
  if (w.difficulty <= 2) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (w.difficulty === 3) return "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

function WeekChip({ week }: { week: WeekOutlook }) {
  const label = week.difficulty === null ? "—" : week.isDouble ? "x2" : String(Math.round(week.difficulty));
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-medium text-black/40 dark:text-white/40">GW{week.event}</span>
      <span
        title={week.difficulty === null ? "No fixture" : `Difficulty ${week.difficulty.toFixed(1)}/5`}
        className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold ${weekClass(week)}`}
      >
        {label}
      </span>
    </div>
  );
}

/** For a saved squad: a week-by-week fixture outlook (next 5 gameweeks),
 * ranked so the players most worth planning a transfer around surface
 * first, plus a flag for any real chip windows coming up in that span. */
export default function TransferPlanner({
  players,
  fixtures,
  teams,
}: {
  players: Player[];
  fixtures: FplRawFixture[];
  teams: TeamRef[];
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
        Save a squad in &quot;My team&quot; above and we&apos;ll map out your next few gameweeks.
      </p>
    );
  }

  const byId = new Map(players.map((p) => [p.id, p]));
  const squadPlayers = squadIds.map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));
  const squadTeamIds = new Set(squadPlayers.map((p) => p.teamId));

  const analysis = analyzeGameweeks(fixtures, teams);
  const rows = buildPlanner(squadPlayers, analysis).slice(0, MAX_ROWS);
  const chipWindows = findChipWindows(analysis, squadTeamIds);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        No fixtures published yet for the next few gameweeks — check back later.
      </p>
    );
  }

  return (
    <div>
      {chipWindows.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {chipWindows.map((flag, i) => (
            <li
              key={i}
              className="rounded-md bg-purple-50 px-3 py-2 text-sm text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
            >
              <span className="font-semibold">GW{flag.event}:</span> {flag.note}
            </li>
          ))}
        </ul>
      )}

      <ul className="space-y-2">
        {rows.map(({ player, weeks, roughPatch }) => (
          <li
            key={player.id}
            className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <PlayerPhoto photoId={player.photoId} name={player.name} size={36} />
                <div className="min-w-0">
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-xs text-black/50 dark:text-white/50">
                    {player.teamShort} · {player.position} · {fmtMoney(player.price)}
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-1.5">
                {weeks.map((w) => (
                  <WeekChip key={w.event} week={w} />
                ))}
              </div>
            </div>
            {roughPatch && (
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {roughPatch.fromEvent === roughPatch.toEvent
                  ? `Tough fixture GW${roughPatch.fromEvent} — worth planning a move in before then.`
                  : `Rough patch GW${roughPatch.fromEvent}–${roughPatch.toEvent} — worth planning a move in before it starts.`}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
