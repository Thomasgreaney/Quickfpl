import type { FixtureRun, Player } from "./fpl-types";
import { averageDifficulty } from "./shortlist";

const POOR_FORM_THRESHOLD = 3;
const TOUGH_FIXTURES_THRESHOLD = 3.3; // avg FDR, 1 (easy) - 5 (hard)
const MAX_FLAGS = 5;
const LOW_CHANCE_THRESHOLD = 25; // percent - FPL's own published chance of playing
const MID_CHANCE_THRESHOLD = 75; // percent

export interface WeakLinkEntry {
  player: Player;
  avgDifficulty: number;
  isInjuryConcern: boolean;
  reason: string;
  action: string;
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

/** A direct, plain-language call on what to do about a flagged player -
 * grounded in FPL's own published availability status and "chance of
 * playing" percent where they've set one, not a guess at injury severity. */
function statusAction(p: Player): string {
  if (p.status === "i" || p.status === "s" || p.status === "u") {
    return "Bench him this week - he's not playing.";
  }
  // status === "d"
  if (p.chanceOfPlayingNextRound !== null) {
    if (p.chanceOfPlayingNextRound <= LOW_CHANCE_THRESHOLD) {
      return `Bench him this week - FPL rates him just ${p.chanceOfPlayingNextRound}% likely to play.`;
    }
    if (p.chanceOfPlayingNextRound <= MID_CHANCE_THRESHOLD) {
      return `A real doubt at ${p.chanceOfPlayingNextRound}% chance of playing - have a replacement ready before your deadline.`;
    }
  }
  return "A doubt, but no reliable percentage published yet - check the team news before your deadline.";
}

function formFixtureReason(badForm: boolean, toughFixtures: boolean): string {
  if (badForm && toughFixtures) return "Form's dried up and the fixtures don't help either. Prime shipping-out candidate.";
  if (badForm) return "Form's dropped off lately - keep an eye on it.";
  return "Tough run of fixtures coming up, even though form's still okay.";
}

function formFixtureAction(badForm: boolean, toughFixtures: boolean): string {
  if (badForm && toughFixtures) return "Consider selling before his price drops further.";
  if (badForm) return "Worth a watch - not urgent yet, but keep an eye on it.";
  return "Hold for now - the fixtures should turn, and his underlying form's still there.";
}

/** Rule-based "who might be dragging you down" - scans a saved squad for
 * injury/availability concerns, poor form and tough upcoming fixtures.
 * Ranked worst-first, capped at a handful so it stays a watchlist, not
 * a wall of text. Each entry carries both the reasoning and a direct
 * suggested action, rather than leaving the read to the visitor. */
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
      const action = isInjuryConcern ? statusAction(player) : formFixtureAction(badForm, toughFixtures);

      return { player, avgDifficulty, isInjuryConcern, reason, action, score };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FLAGS)
    .map(({ player, avgDifficulty, isInjuryConcern, reason, action }) => ({
      player,
      avgDifficulty,
      isInjuryConcern,
      reason,
      action,
    }));
}
