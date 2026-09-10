import type { FixtureRun, Player } from "./fpl-types";
import { averageDifficulty } from "./shortlist";

const POOR_FORM_THRESHOLD = 3;
const TOUGH_FIXTURES_THRESHOLD = 3.3; // avg FDR, 1 (easy) - 5 (hard)
const MAX_FLAGS = 5;

export interface WeakLinkEntry {
  player: Player;
  avgDifficulty: number;
  isInjuryConcern: boolean;
  reason: string;
}

function statusReason(p: Player): string {
  if (p.news) return p.news;
  switch (p.status) {
    case "i":
      return "Currently injured.";
    case "d":
      return "A doubt for the next match - check the latest before your deadline.";
    case "s":
      return "Suspended for the next match.";
    case "u":
      return "Currently unavailable.";
    default:
      return "Availability's in question - worth checking before your deadline.";
  }
}

function formFixtureReason(badForm: boolean, toughFixtures: boolean): string {
  if (badForm && toughFixtures) return "Form's dried up and the fixtures don't help either. Prime shipping-out candidate.";
  if (badForm) return "Form's dropped off lately - keep an eye on it.";
  return "Tough run of fixtures coming up, even though form's still okay.";
}

/** Rule-based "who might be dragging you down" - scans a saved squad for
 * injury/availability concerns, poor form and tough upcoming fixtures.
 * Ranked worst-first, capped at a handful so it stays a watchlist, not
 * a wall of text. */
export function buildWeakLinks(
  players: Player[],
  fixturesByTeam: Record<number, FixtureRun[]>,
  squadIds: Set<number>
): WeakLinkEntry[] {
  const squad = players.filter((p) => squadIds.has(p.id));

  return squad
    .map((player) => {
      const isInjuryConcern = player.status !== "a";
      const avgDifficulty = averageDifficulty(fixturesByTeam[player.teamId]);
      const badForm = player.form <= POOR_FORM_THRESHOLD;
      const toughFixtures = avgDifficulty >= TOUGH_FIXTURES_THRESHOLD;

      if (!isInjuryConcern && !badForm && !toughFixtures) return null;

      const score = isInjuryConcern ? 100 : avgDifficulty - player.form;
      const reason = isInjuryConcern ? statusReason(player) : formFixtureReason(badForm, toughFixtures);

      return { player, avgDifficulty, isInjuryConcern, reason, score };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FLAGS)
    .map(({ player, avgDifficulty, isInjuryConcern, reason }) => ({
      player,
      avgDifficulty,
      isInjuryConcern,
      reason,
    }));
}
