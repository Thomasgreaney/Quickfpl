import type { FixtureRun, Player, Position } from "./fpl-types";

const MAX_PER_POSITION = 3;
const DIFFERENTIAL_OWNERSHIP_THRESHOLD = 10; // percent
const GOOD_FORM_THRESHOLD = 5;
const KIND_FIXTURES_THRESHOLD = 2.7; // avg FDR, 1 (easy) - 5 (hard)
const NEUTRAL_DIFFICULTY = 3; // used when a team has no upcoming fixtures listed

export interface ShortlistEntry {
  player: Player;
  avgDifficulty: number;
  isDifferential: boolean;
  reason: string;
}

export function averageDifficulty(fixtures: FixtureRun[] | undefined): number {
  if (!fixtures || fixtures.length === 0) return NEUTRAL_DIFFICULTY;
  return fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length;
}

function reasonFor(form: number, avgDifficulty: number): string {
  const goodForm = form >= GOOD_FORM_THRESHOLD;
  const kindFixtures = avgDifficulty <= KIND_FIXTURES_THRESHOLD;

  if (goodForm && kindFixtures) return "Good form, kind fixtures coming up. Hard to leave out.";
  if (goodForm) return "Form's real even with the tougher fixtures ahead.";
  if (kindFixtures) return "Fixtures are kind enough to take a punt, even if form's just okay.";
  return "On the radar, nothing standout yet.";
}

/** Rule-based "who's worth considering" - ranked by recent form and how
 * easy their next few fixtures are. Excludes unavailable players and
 * anyone already in the given squad. */
export function buildShortlist(
  players: Player[],
  fixturesByTeam: Record<number, FixtureRun[]>,
  excludeIds: Set<number>
): Record<Position, ShortlistEntry[]> {
  const positions: Position[] = ["GKP", "DEF", "MID", "FWD"];
  const result = {} as Record<Position, ShortlistEntry[]>;

  for (const position of positions) {
    const scored = players
      .filter((p) => p.position === position)
      .filter((p) => p.status === "a")
      .filter((p) => !excludeIds.has(p.id))
      .map((p) => {
        const avgDifficulty = averageDifficulty(fixturesByTeam[p.teamId]);
        const score = p.form - avgDifficulty;
        return {
          player: p,
          avgDifficulty,
          isDifferential: p.ownership < DIFFERENTIAL_OWNERSHIP_THRESHOLD,
          reason: reasonFor(p.form, avgDifficulty),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_POSITION);

    result[position] = scored.map(({ player, avgDifficulty, isDifferential, reason }) => ({
      player,
      avgDifficulty,
      isDifferential,
      reason,
    }));
  }

  return result;
}
