import type { FplRawFixture, FixtureRun, TeamRef } from "./fpl-types";

const NEXT_COUNT = 3;

/** Maps each team id to its next few fixtures, nearest first. */
export function buildFixtureRuns(
  fixtures: FplRawFixture[],
  teams: TeamRef[]
): Record<number, FixtureRun[]> {
  const shortById = new Map(teams.map((t) => [t.id, t.short]));

  const upcoming = fixtures
    .filter((f) => !f.finished)
    .sort((a, b) => {
      if (a.event !== null && b.event !== null && a.event !== b.event) return a.event - b.event;
      const at = a.kickoff_time ? Date.parse(a.kickoff_time) : Infinity;
      const bt = b.kickoff_time ? Date.parse(b.kickoff_time) : Infinity;
      return at - bt;
    });

  const byTeam: Record<number, FixtureRun[]> = {};

  for (const f of upcoming) {
    const legs: [number, boolean, number][] = [
      [f.team_h, true, f.team_h_difficulty],
      [f.team_a, false, f.team_a_difficulty],
    ];
    for (const [teamId, isHome, difficulty] of legs) {
      const list = (byTeam[teamId] ??= []);
      if (list.length >= NEXT_COUNT) continue;
      const opponentId = isHome ? f.team_a : f.team_h;
      list.push({
        opponentShort: shortById.get(opponentId) ?? "?",
        isHome,
        difficulty,
      });
    }
  }

  return byTeam;
}
