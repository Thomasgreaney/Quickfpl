import type { Player, Position } from "./fpl-types";

const BUDGET = 100; // £m, standard FPL squad budget
const MAX_PER_TEAM = 3;
const OWNERSHIP_BUCKET = 3; // percent - within this range, prefer the cheaper player

const FORMATION: { position: Position; count: number }[] = [
  { position: "GKP", count: 2 },
  { position: "DEF", count: 5 },
  { position: "MID", count: 5 },
  { position: "FWD", count: 3 },
];

/** A "template" demo squad built from real ownership data - the most-owned
 * available player at each position, subject to the same budget and
 * max-3-per-team rules a real squad has to respect. Ownership-first per
 * position, but every pick is checked against the real cheapest price
 * still available at every other position (not a guessed floor), so a
 * high-ownership pick is only taken if the rest of the squad can still be
 * completed within budget afterwards. Falls back to the cheapest
 * remaining candidates for any position that still comes up short, so
 * this always returns a complete, legal 15-man squad when there's enough
 * player data to build one - or null if there genuinely isn't (e.g. a
 * thin test dataset), in which case the caller should just show the
 * normal empty state instead. */
export function buildDemoSquad(players: Player[]): Record<Position, number[]> | null {
  const poolByPosition: Record<Position, Player[]> = { GKP: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    if (p.status === "a") poolByPosition[p.position].push(p);
  }

  const cheapestByPosition: Record<Position, number> = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const { position } of FORMATION) {
    cheapestByPosition[position] = poolByPosition[position].reduce(
      (min, p) => Math.min(min, p.price),
      Infinity
    );
  }

  const squad: Record<Position, number[]> = { GKP: [], DEF: [], MID: [], FWD: [] };
  const teamCounts = new Map<number, number>();
  let spent = 0;

  function reserveForRest(excludingPosition: Position): number {
    let reserve = 0;
    for (const { position, count } of FORMATION) {
      const remaining = count - squad[position].length - (position === excludingPosition ? 1 : 0);
      if (remaining > 0) reserve += remaining * cheapestByPosition[position];
    }
    return reserve;
  }

  function fits(position: Position, p: Player): boolean {
    const teamCount = teamCounts.get(p.teamId) ?? 0;
    if (teamCount >= MAX_PER_TEAM) return false;
    return spent + p.price + reserveForRest(position) <= BUDGET;
  }

  function take(position: Position, p: Player) {
    squad[position].push(p.id);
    teamCounts.set(p.teamId, (teamCounts.get(p.teamId) ?? 0) + 1);
    spent += p.price;
  }

  for (const { position, count } of FORMATION) {
    // Rank by ownership, but within the same rough ownership bracket
    // prefer the cheaper player - two picks that are nearly as popular as
    // each other are a much easier choice than the raw ranking suggests,
    // and taking the cheaper one leaves more headroom for the rest of the
    // squad without meaningfully changing how "realistic" the pick is.
    const sorted = [...poolByPosition[position]].sort((a, b) => {
      const bucketA = Math.round(a.ownership / OWNERSHIP_BUCKET);
      const bucketB = Math.round(b.ownership / OWNERSHIP_BUCKET);
      if (bucketA !== bucketB) return bucketB - bucketA;
      return a.price - b.price;
    });
    for (const p of sorted) {
      if (squad[position].length >= count) break;
      if (fits(position, p)) take(position, p);
    }

    // Safety-net fallback: should rarely trigger given the reserve check
    // above, but guarantees completion even on adversarial/thin data by
    // taking the cheapest remaining legal candidates outright.
    if (squad[position].length < count) {
      for (const p of [...poolByPosition[position]].sort((a, b) => a.price - b.price)) {
        if (squad[position].length >= count) break;
        if (squad[position].includes(p.id)) continue;
        const teamCount = teamCounts.get(p.teamId) ?? 0;
        if (teamCount >= MAX_PER_TEAM) continue;
        if (spent + p.price > BUDGET) continue;
        take(position, p);
      }
    }
  }

  const total = FORMATION.reduce((sum, f) => sum + squad[f.position].length, 0);
  return total === 15 ? squad : null;
}
