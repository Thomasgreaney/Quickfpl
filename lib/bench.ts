import type { Player } from "./fpl-types";

const BENCH_SIZE = 4;
const OUTFIELD_BENCH_SIZE = 3;

// Valid FPL starting formations need, out of 10 outfield starters:
// 3-5 defenders, 2-5 midfielders, 1-3 forwards. With a fixed 5/5/3 squad
// split, that bounds how many of each position can be benched.
const MAX_BENCHED: Record<"DEF" | "MID" | "FWD", number> = { DEF: 2, MID: 3, FWD: 2 };

/** Lower = weaker = more worth benching. Injured/doubtful/suspended players
 * always sort to the bottom regardless of form. */
function benchScore(p: Player): number {
  const availabilityPenalty = p.status !== "a" ? -1000 : 0;
  return availabilityPenalty + p.form;
}

function weakestN(players: Player[], n: number): Player[] {
  return [...players].sort((a, b) => benchScore(a) - benchScore(b)).slice(0, n);
}

function totalScore(players: Player[]): number {
  return players.reduce((sum, p) => sum + benchScore(p), 0);
}

/** Picks the 4 squad players most worth benching: the weaker of the 2
 * goalkeepers, plus the 3 outfield players (across DEF/MID/FWD) whose
 * combined form/availability is worst - while keeping the remaining 11 a
 * legal FPL formation (3-5 DEF, 2-5 MID, 1-3 FWD). Requires a full
 * 2/5/5/3 squad. */
export function suggestBench(squadPlayers: Player[]): number[] {
  const gkps = squadPlayers.filter((p) => p.position === "GKP");
  const defs = squadPlayers.filter((p) => p.position === "DEF");
  const mids = squadPlayers.filter((p) => p.position === "MID");
  const fwds = squadPlayers.filter((p) => p.position === "FWD");

  if (gkps.length !== 2 || defs.length !== 5 || mids.length !== 5 || fwds.length !== 3) {
    return []; // not a complete, standard-shaped squad yet
  }

  const benchedGkp = weakestN(gkps, 1)[0];

  // Try every valid (defBenched, midBenched, fwdBenched) split summing to 3,
  // and keep whichever one benches the objectively weakest 3 outfield
  // players achievable under the formation limits.
  let best: Player[] | null = null;
  let bestScore = Infinity;

  for (let dCount = 0; dCount <= Math.min(MAX_BENCHED.DEF, defs.length); dCount++) {
    for (let mCount = 0; mCount <= Math.min(MAX_BENCHED.MID, mids.length); mCount++) {
      const fCount = OUTFIELD_BENCH_SIZE - dCount - mCount;
      if (fCount < 0 || fCount > Math.min(MAX_BENCHED.FWD, fwds.length)) continue;

      const candidates = [...weakestN(defs, dCount), ...weakestN(mids, mCount), ...weakestN(fwds, fCount)];
      const score = totalScore(candidates);
      if (score < bestScore) {
        bestScore = score;
        best = candidates;
      }
    }
  }

  const benchedOutfield = best ?? [];
  const bench = [benchedGkp, ...benchedOutfield].filter((p): p is Player => Boolean(p));
  return bench.slice(0, BENCH_SIZE).map((p) => p.id);
}
