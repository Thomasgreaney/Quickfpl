import type { FplRawFixture, Player, TeamRef } from "./fpl-types";

export type ChipType = "wildcard" | "freehit" | "benchboost" | "triplecaptain";

export const CHIP_LABELS: Record<ChipType, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  benchboost: "Bench Boost",
  triplecaptain: "Triple Captain",
};

interface TeamFixtureInEvent {
  opponentShort: string;
  isHome: boolean;
  difficulty: number;
}

interface EventTeamData {
  teamId: number;
  fixtures: TeamFixtureInEvent[];
}

export interface GameweekAnalysis {
  event: number;
  teams: EventTeamData[]; // only teams with at least one fixture this event
}

/** Scans upcoming fixtures into a per-gameweek, per-team fixture breakdown. */
export function analyzeGameweeks(fixtures: FplRawFixture[], teams: TeamRef[]): GameweekAnalysis[] {
  const shortById = new Map(teams.map((t) => [t.id, t.short]));
  const upcoming = fixtures.filter((f) => !f.finished && f.event !== null);
  const events = [...new Set(upcoming.map((f) => f.event as number))].sort((a, b) => a - b);

  return events.map((event) => {
    const eventFixtures = upcoming.filter((f) => f.event === event);
    const byTeam = new Map<number, TeamFixtureInEvent[]>();
    for (const f of eventFixtures) {
      const home = byTeam.get(f.team_h) ?? [];
      home.push({ opponentShort: shortById.get(f.team_a) ?? "?", isHome: true, difficulty: f.team_h_difficulty });
      byTeam.set(f.team_h, home);

      const away = byTeam.get(f.team_a) ?? [];
      away.push({ opponentShort: shortById.get(f.team_h) ?? "?", isHome: false, difficulty: f.team_a_difficulty });
      byTeam.set(f.team_a, away);
    }
    return {
      event,
      teams: [...byTeam.entries()].map(([teamId, fx]) => ({ teamId, fixtures: fx })),
    };
  });
}

function fixtureLabel(f: TeamFixtureInEvent): string {
  return `${f.opponentShort} (${f.isHome ? "H" : "A"})`;
}

export interface ChipCandidate {
  event: number;
  reason: string;
  suggestedPlayerName?: string;
}

export interface ChipAdvice {
  chip: ChipType;
  candidates: ChipCandidate[]; // ranked best-first, up to 3, empty if nothing found
  emptyReason: string;
}

const MAX_CANDIDATES = 3;

/** Rule-based chip timing, ranked to the top 3 gameweeks per chip, using
 * real fixture data and (when available) the visitor's own saved squad. */
export function recommendChips(
  chipsRemaining: ChipType[],
  analysis: GameweekAnalysis[],
  teams: TeamRef[],
  squadPlayers: Player[],
  allPlayers: Player[]
): ChipAdvice[] {
  const shortById = new Map(teams.map((t) => [t.id, t.short]));
  const allTeamIds = teams.map((t) => t.id);
  const usingRealSquad = squadPlayers.length > 0;
  // Without a saved squad, judge gameweeks league-wide instead of leaving
  // every chip empty.
  const relevantTeamIds = usingRealSquad ? [...new Set(squadPlayers.map((p) => p.teamId))] : allTeamIds;

  const events = analysis.map((a) => a.event);
  const scanRange =
    events.length > 0 ? `GW${Math.min(...events)}–${Math.max(...events)}` : "the fixtures published so far";
  const noneYetSuffix = `Nothing in ${scanRange} yet — doubles and blanks usually only get confirmed once the season's underway. Check back later.`;

  const doubleRanked = analysis
    .map((a) => ({
      event: a.event,
      doublers: a.teams.filter((t) => t.fixtures.length >= 2 && relevantTeamIds.includes(t.teamId)),
    }))
    .filter((x) => x.doublers.length > 0)
    .sort((a, b) => b.doublers.length - a.doublers.length)
    .slice(0, MAX_CANDIDATES);

  const blankRanked = analysis
    .map((a) => {
      const present = new Set(a.teams.map((t) => t.teamId));
      return { event: a.event, blankers: relevantTeamIds.filter((id) => !present.has(id)) };
    })
    .filter((x) => x.blankers.length > 0)
    .sort((a, b) => b.blankers.length - a.blankers.length)
    .slice(0, MAX_CANDIDATES);

  function bestCaptainFor(teamIds: number[]): Player | undefined {
    const pool = usingRealSquad ? squadPlayers : allPlayers;
    return pool
      .filter((p) => teamIds.includes(p.teamId) && (p.position === "MID" || p.position === "FWD"))
      .sort((a, b) => b.form - a.form || b.totalPoints - a.totalPoints)[0];
  }

  const advice: ChipAdvice[] = [];

  for (const chip of chipsRemaining) {
    if (chip === "benchboost") {
      const candidates: ChipCandidate[] = doubleRanked.map(({ event, doublers }) => {
        const sample = doublers
          .slice(0, 2)
          .map((d) => `${shortById.get(d.teamId)} (${d.fixtures.map(fixtureLabel).join(", ")})`)
          .join("; ");
        return { event, reason: `${doublers.length} of the relevant teams play twice — ${sample}.` };
      });
      advice.push({ chip, candidates, emptyReason: `No double gameweeks yet. ${noneYetSuffix}` });
    } else if (chip === "triplecaptain") {
      const candidates: ChipCandidate[] = doubleRanked.map(({ event, doublers }) => {
        const teamIds = doublers.map((d) => d.teamId);
        const player = bestCaptainFor(teamIds);
        const best = doublers[0];
        return {
          event,
          reason: `${shortById.get(best.teamId)} play twice — ${best.fixtures.map(fixtureLabel).join(", ")}.`,
          suggestedPlayerName: player?.name,
        };
      });
      advice.push({ chip, candidates, emptyReason: `Nothing standing out yet. ${noneYetSuffix}` });
    } else if (chip === "freehit") {
      const candidates: ChipCandidate[] = blankRanked.map(({ event, blankers }) => ({
        event,
        reason: `${blankers.length} relevant team${blankers.length === 1 ? "" : "s"} won't play — ${blankers
          .map((id) => shortById.get(id))
          .join(", ")}.`,
      }));
      advice.push({ chip, candidates, emptyReason: `No blank gameweeks yet. ${noneYetSuffix}` });
    } else if (chip === "wildcard") {
      const combined = [
        ...doubleRanked.map((x) => ({ event: x.event, count: x.doublers.length, kind: "double" as const })),
        ...blankRanked.map((x) => ({ event: x.event, count: x.blankers.length, kind: "blank" as const })),
      ]
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_CANDIDATES)
        .sort((a, b) => a.event - b.event);
      const candidates: ChipCandidate[] = combined.map((t) => ({
        event: Math.max(1, t.event - 1),
        reason:
          t.kind === "double"
            ? `Gets your squad ready before gameweek ${t.event}'s double.`
            : `Gets your squad ready before gameweek ${t.event} blanks for part of it.`,
      }));
      advice.push({
        chip,
        candidates,
        emptyReason: `No obvious trigger yet — use it when your squad's fixtures turn bad, not just because you're bored of it. ${noneYetSuffix}`,
      });
    }
  }

  return advice;
}
