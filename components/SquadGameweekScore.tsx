"use client";

import { useEffect, useState } from "react";
import type { Player } from "@/lib/fpl-types";
import {
  SQUAD_UPDATED_EVENT,
  readSquadPlayerIds,
  readBenchPlayerIds,
  readCaptainId,
} from "@/lib/squad-storage";

const SQUAD_SIZE = 15;

/** Live points for the saved squad's starting XI in the current/most
 * recently played gameweek, captain doubled - reuses the same live
 * per-player gameweek points already fetched for the home page wrap-up.
 * Self-hides whenever there's no current gameweek or no full saved
 * squad, so it's safe to always render. */
export default function SquadGameweekScore({
  players,
  eventId,
  eventName,
}: {
  players: Player[];
  eventId: number | null;
  eventName: string | null;
}) {
  const [squadIds, setSquadIds] = useState<number[]>([]);
  const [benchIds, setBenchIds] = useState<Set<number>>(new Set());
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function reload() {
      setSquadIds(readSquadPlayerIds());
      setBenchIds(new Set(readBenchPlayerIds()));
      setCaptainId(readCaptainId());
    }
    // Initial read, deferred so server and first client render match
    // (localStorage doesn't exist on the server).
    Promise.resolve().then(() => {
      reload();
      setLoaded(true);
    });
    window.addEventListener(SQUAD_UPDATED_EVENT, reload);
    return () => window.removeEventListener(SQUAD_UPDATED_EVENT, reload);
  }, []);

  if (!loaded || !eventId || squadIds.length !== SQUAD_SIZE) return null;

  const byId = new Map(players.map((p) => [p.id, p]));
  const starters = squadIds
    .filter((id) => !benchIds.has(id))
    .map((id) => byId.get(id))
    .filter((p): p is Player => Boolean(p));

  if (starters.length === 0) return null;

  const total = starters.reduce(
    (sum, p) => sum + p.eventPoints + (p.id === captainId ? p.eventPoints : 0),
    0
  );
  const sorted = [...starters].sort((a, b) => b.eventPoints - a.eventPoints);

  return (
    <div className="mb-8 card p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
          {eventName ?? `Gameweek ${eventId}`} score
        </p>
        <p className="text-2xl font-black tabular-nums">
          {total} <span className="text-sm font-medium text-black/50 dark:text-white/50">pts</span>
        </p>
      </div>
      <ul className="space-y-1">
        {sorted.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              {p.name}
              {p.id === captainId && (
                <span className="ml-1.5 rounded bg-purple-600 px-1 py-0.5 text-[10px] font-bold text-white">
                  C
                </span>
              )}
            </span>
            <span className="flex-shrink-0 tabular-nums text-black/70 dark:text-white/70">
              {p.id === captainId ? `${p.eventPoints} × 2 = ${p.eventPoints * 2}` : p.eventPoints}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-black/40 dark:text-white/40">
        Captain&apos;s score is doubled. We don&apos;t simulate autosubs, so a blank from a starter
        isn&apos;t backfilled from your bench.
      </p>
    </div>
  );
}
