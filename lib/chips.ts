import type { FplRawFixture, TeamRef } from "./fpl-types";

export type ChipType = "wildcard" | "freehit" | "benchboost" | "triplecaptain";

export const CHIP_LABELS: Record<ChipType, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  benchboost: "Bench Boost",
  triplecaptain: "Triple Captain",
};

export interface GameweekAnalysis {
  event: number;
  doubleTeamIds: number[]; // teams with 2+ fixtures this gameweek
  blankTeamIds: number[]; // teams with no fixture this gameweek
}

/** Scans upcoming fixtures and flags double/blank gameweeks per team. */
export function analyzeGameweeks(fixtures: FplRawFixture[], teams: TeamRef[]): GameweekAnalysis[] {
  const upcoming = fixtures.filter((f) => !f.finished && f.event !== null);
  const events = [...new Set(upcoming.map((f) => f.event as number))].sort((a, b) => a - b);
  const allTeamIds = teams.map((t) => t.id);

  return events.map((event) => {
    const eventFixtures = upcoming.filter((f) => f.event === event);
    const countByTeam = new Map<number, number>();
    for (const f of eventFixtures) {
      countByTeam.set(f.team_h, (countByTeam.get(f.team_h) ?? 0) + 1);
      countByTeam.set(f.team_a, (countByTeam.get(f.team_a) ?? 0) + 1);
    }
    return {
      event,
      doubleTeamIds: allTeamIds.filter((id) => (countByTeam.get(id) ?? 0) >= 2),
      blankTeamIds: allTeamIds.filter((id) => (countByTeam.get(id) ?? 0) === 0),
    };
  });
}

export interface ChipAdvice {
  chip: ChipType;
  bestEvent: number | null;
  affectedCount: number; // how many of the user's squad this gameweek involves
  reason: string;
}

/** Rule-based chip timing advice from real fixture data and the user's own squad. */
export function recommendChips(
  chipsRemaining: ChipType[],
  analysis: GameweekAnalysis[],
  squadTeamIds: number[]
): ChipAdvice[] {
  function bestEventBy(pickTeamIds: (a: GameweekAnalysis) => number[]) {
    let best: { event: number; count: number } | null = null;
    for (const a of analysis) {
      const count = squadTeamIds.filter((id) => pickTeamIds(a).includes(id)).length;
      if (count > 0 && (!best || count > best.count)) best = { event: a.event, count };
    }
    return best;
  }

  const bestDouble = bestEventBy((a) => a.doubleTeamIds);
  const bestBlank = bestEventBy((a) => a.blankTeamIds);

  const advice: ChipAdvice[] = [];

  for (const chip of chipsRemaining) {
    if (chip === "benchboost") {
      advice.push(
        bestDouble
          ? {
              chip,
              bestEvent: bestDouble.event,
              affectedCount: bestDouble.count,
              reason: `Gameweek ${bestDouble.event} has ${bestDouble.count} of your squad's teams playing twice. That's your bench boost window.`,
            }
          : {
              chip,
              bestEvent: null,
              affectedCount: 0,
              reason: "No double gameweeks in your squad's teams yet, from what we can see. Hold it until one shows up.",
            }
      );
    } else if (chip === "triplecaptain") {
      advice.push(
        bestDouble
          ? {
              chip,
              bestEvent: bestDouble.event,
              affectedCount: bestDouble.count,
              reason: `Gameweek ${bestDouble.event} is your best double-fixture shout — check which of your players actually start twice before pulling the trigger.`,
            }
          : {
              chip,
              bestEvent: null,
              affectedCount: 0,
              reason: "Nothing standing out yet. Save it for a double gameweek or a monster single fixture.",
            }
      );
    } else if (chip === "freehit") {
      advice.push(
        bestBlank
          ? {
              chip,
              bestEvent: bestBlank.event,
              affectedCount: bestBlank.count,
              reason: `Gameweek ${bestBlank.event} blanks for ${bestBlank.count} of your squad's teams. That's the one to Free Hit through.`,
            }
          : {
              chip,
              bestEvent: null,
              affectedCount: 0,
              reason: "No blank gameweeks hitting your squad yet. Sit on it.",
            }
      );
    } else if (chip === "wildcard") {
      const target = [bestBlank, bestDouble]
        .filter((x): x is { event: number; count: number } => x !== null)
        .sort((a, b) => a.event - b.event)[0];
      advice.push(
        target
          ? {
              chip,
              bestEvent: Math.max(1, target.event - 1),
              affectedCount: target.count,
              reason: `Play it the gameweek before ${target.event} to get your squad shaped up for the double/blank coming then.`,
            }
          : {
              chip,
              bestEvent: null,
              affectedCount: 0,
              reason: "No obvious trigger yet. Use it when your squad's fixtures turn bad, not just because you're bored of it.",
            }
      );
    }
  }

  return advice;
}
