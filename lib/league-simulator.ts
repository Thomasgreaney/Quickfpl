export interface LeagueEntry {
  entryId: number;
  teamName: string;
  managerName: string;
  currentRank: number;
  currentTotal: number;
}

export interface SimulatedEntry extends LeagueEntry {
  winProbability: number; // 0-1
  top3Probability: number; // 0-1
  avgFinalPosition: number;
  avgFinalPoints: number;
}

const TOTAL_GAMEWEEKS = 38;
const SIMULATIONS = 2000;
// FPL gameweek scores across active managers typically spread with a
// standard deviation in roughly this range - we don't have each manager's
// own gameweek-by-gameweek history (the standings endpoint only gives a
// running total), so this is a shared, approximate spread applied to
// everyone rather than a per-manager one.
const ASSUMED_WEEKLY_STD_DEV = 16;

function gaussianRandom(mean: number, stdDev: number): number {
  // Box-Muller transform
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stdDev;
}

/** Monte Carlo projection of a mini-league's remaining season. Each
 * manager's own season-so-far average becomes their simulated per-
 * gameweek mean; a shared assumed spread stands in for week-to-week
 * variance we can't derive from the standings data alone. This is a
 * statistical estimate, not a squad-by-squad simulation of each
 * manager's actual team. */
export function simulateLeague(entries: LeagueEntry[], gameweeksPlayed: number): SimulatedEntry[] {
  const remainingGameweeks = Math.max(0, TOTAL_GAMEWEEKS - gameweeksPlayed);
  const n = entries.length;
  const wins = new Array(n).fill(0);
  const top3s = new Array(n).fill(0);
  const positionSum = new Array(n).fill(0);
  const pointsSum = new Array(n).fill(0);

  const perGwMeans = entries.map((e) => (gameweeksPlayed > 0 ? e.currentTotal / gameweeksPlayed : e.currentTotal));

  for (let sim = 0; sim < SIMULATIONS; sim++) {
    const finals = entries.map((e, i) => {
      let total = e.currentTotal;
      for (let gw = 0; gw < remainingGameweeks; gw++) {
        total += Math.max(0, gaussianRandom(perGwMeans[i], ASSUMED_WEEKLY_STD_DEV));
      }
      return total;
    });

    const order = finals.map((total, i) => ({ i, total })).sort((a, b) => b.total - a.total);

    order.forEach(({ i }, position) => {
      positionSum[i] += position + 1;
      pointsSum[i] += finals[i];
      if (position === 0) wins[i]++;
      if (position < 3) top3s[i]++;
    });
  }

  return entries
    .map((e, i) => ({
      ...e,
      winProbability: wins[i] / SIMULATIONS,
      top3Probability: top3s[i] / SIMULATIONS,
      avgFinalPosition: positionSum[i] / SIMULATIONS,
      avgFinalPoints: pointsSum[i] / SIMULATIONS,
    }))
    .sort((a, b) => b.winProbability - a.winProbability);
}
