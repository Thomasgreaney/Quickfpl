import type { FplRawFixture, TeamRef } from "@/lib/fpl-types";
import type { GameweekWrapup as GameweekWrapupData } from "@/lib/gameweek-wrapup";
import GameweekScoreboard from "./GameweekScoreboard";
import HighlightedParagraphs from "./HighlightedParagraphs";
import PremiumGate from "./PremiumGate";

/** Replaces the gameweek preview once its deadline passes. The scoreboard
 * is always real, live fixture data; the AI recap underneath it only
 * appears once scripts/generate-gameweek-wrapup.ts has written one for
 * this exact gameweek (it only runs once every match has finished), so
 * there's a gap between the deadline and the recap landing where the
 * scoreboard stands alone. The teaser is free for everyone; the full
 * write-up is a Moyes+ perk, matching the preview. */
export default function GameweekWrapup({
  eventName,
  fixtures,
  teams,
  wrapup,
}: {
  eventName: string;
  fixtures: FplRawFixture[];
  teams: TeamRef[];
  wrapup: GameweekWrapupData | null;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-neutral-900 sm:p-5">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
        {eventName} wrap-up
      </p>

      <div className="mb-3">
        <GameweekScoreboard fixtures={fixtures} teams={teams} />
      </div>

      {wrapup ? (
        <>
          <HighlightedParagraphs text={wrapup.teaser} />
          <PremiumGate requireTier="moyes" tier="Moyes">
            <div className="mt-1">
              <HighlightedParagraphs text={wrapup.fullWriteup} />
            </div>
          </PremiumGate>
        </>
      ) : (
        <p className="text-sm text-black/50 dark:text-white/50">
          Full write-up lands once the last match finishes.
        </p>
      )}
    </div>
  );
}
