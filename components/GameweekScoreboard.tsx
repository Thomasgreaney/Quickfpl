import type { FplRawFixture, TeamRef } from "@/lib/fpl-types";
import LocalTime from "./LocalTime";

function fixtureBadge(f: FplRawFixture): { text: string; live: boolean } | null {
  if (f.finished) return { text: "FT", live: false };
  if (f.started) return { text: "LIVE", live: true };
  return null;
}

/** This gameweek's fixtures with live scores - real, always-fresh data
 * (no AI involved), refreshed on the same schedule as the rest of the
 * site's live data. Shown as the top half of the gameweek wrap-up, so it
 * works even before the AI recap below it has been generated. */
export default function GameweekScoreboard({
  fixtures,
  teams,
}: {
  fixtures: FplRawFixture[];
  teams: TeamRef[];
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const sorted = [...fixtures].sort((a, b) => {
    const ta = a.kickoff_time ? Date.parse(a.kickoff_time) : 0;
    const tb = b.kickoff_time ? Date.parse(b.kickoff_time) : 0;
    return ta - tb;
  });

  return (
    <div className="overflow-hidden rounded-lg border border-black/[.06] dark:border-white/10 sm:grid sm:grid-cols-2 sm:gap-x-4">
      {sorted.map((f, i) => {
        const home = teamsById.get(f.team_h);
        const away = teamsById.get(f.team_a);
        const badge = fixtureBadge(f);
        const underway = f.started || f.finished;
        return (
          <div
            key={f.id}
            className={`flex items-center gap-2 px-2.5 py-2 text-sm ${
              i % 2 === 1 ? "bg-black/[.02] dark:bg-white/[.03]" : ""
            }`}
          >
            <span className="min-w-0 flex-1 truncate font-medium">{home?.short ?? "?"}</span>
            <span className="flex-shrink-0 font-mono tabular-nums">
              {underway ? (
                <>
                  {f.team_h_score ?? 0}-{f.team_a_score ?? 0}
                </>
              ) : (
                <span className="text-xs text-black/40 dark:text-white/40">
                  {f.kickoff_time ? <LocalTime iso={f.kickoff_time} /> : "TBC"}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-right font-medium">{away?.short ?? "?"}</span>
            <span className="w-9 flex-shrink-0 text-right">
              {badge && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    badge.live
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
                  }`}
                >
                  {badge.text}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
