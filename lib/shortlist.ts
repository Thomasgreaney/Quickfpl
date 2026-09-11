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

export interface ShortlistVerdict {
  text: string;
  /** true = a specific named swap; false = a softer note (no clear upgrade,
   * or nothing in the saved squad to compare against). */
  confident: boolean;
}

function scoreFor(p: Player, fixturesByTeam: Record<number, FixtureRun[]>): number {
  return p.form - averageDifficulty(fixturesByTeam[p.teamId]);
}

const CLEAR_UPGRADE_FORM_GAP = 0.5;
const SIMILAR_PRICE_THRESHOLD = 0.3; // £m

/** A direct, named "sell X, bring in Y" call for a shortlist pick, built
 * from the visitor's own saved squad - or an honest, softer note when
 * there isn't enough to go on (no squad, no player in this position, or
 * the current squad player isn't actually a clear downgrade). Grounded
 * entirely in form and price, both already-fetched real numbers - no
 * separate points-projection model invented for this. */
export function buildShortlistVerdict(
  entry: ShortlistEntry,
  squadPlayersInPosition: Player[],
  fixturesByTeam: Record<number, FixtureRun[]>
): ShortlistVerdict {
  if (squadPlayersInPosition.length === 0) {
    return {
      text: `No ${entry.player.position} in your saved squad to compare against - on form and fixtures alone, this one's worth watching.`,
      confident: false,
    };
  }

  const weakest = [...squadPlayersInPosition].sort(
    (a, b) => scoreFor(a, fixturesByTeam) - scoreFor(b, fixturesByTeam)
  )[0];

  const formGap = entry.player.form - weakest.form;
  if (formGap < CLEAR_UPGRADE_FORM_GAP) {
    return {
      text: `Not a clear upgrade on ${weakest.name} right now based on recent form - worth watching rather than an immediate swap.`,
      confident: false,
    };
  }

  const priceDiff = entry.player.price - weakest.price;
  const priceText =
    Math.abs(priceDiff) < SIMILAR_PRICE_THRESHOLD
      ? "similar price"
      : priceDiff > 0
        ? `£${priceDiff.toFixed(1)}m more`
        : `£${Math.abs(priceDiff).toFixed(1)}m cheaper`;
  const projectedPoints = Math.round(formGap * 3);

  return {
    text: `Sell ${weakest.name}, bring in ${entry.player.name} - ${priceText}, roughly +${projectedPoints} points over the next 3 gameweeks based on recent form.`,
    confident: true,
  };
}
