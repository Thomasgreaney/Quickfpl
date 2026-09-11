import type { GameweekAnalysis } from "./chips";
import type { Player } from "./fpl-types";

const WINDOW = 5; // gameweeks ahead
const BLANK_PENALTY = 5; // treat a blank gameweek as worst-case for ranking - no fixture beats a hard one
const TOUGH_THRESHOLD = 4;

export interface WeekOutlook {
  event: number;
  difficulty: number | null; // null = blank that gameweek
  isDouble: boolean;
}

export interface PlannerRow {
  player: Player;
  weeks: WeekOutlook[];
  avgDifficulty: number;
  roughPatch: { fromEvent: number; toEvent: number } | null;
}

export interface WeekFlag {
  event: number;
  note: string;
}

function outlookFor(analysis: GameweekAnalysis[], teamId: number): WeekOutlook[] {
  return analysis.slice(0, WINDOW).map((gw) => {
    const teamData = gw.teams.find((t) => t.teamId === teamId);
    if (!teamData || teamData.fixtures.length === 0) {
      return { event: gw.event, difficulty: null, isDouble: false };
    }
    const avg = teamData.fixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamData.fixtures.length;
    return { event: gw.event, difficulty: avg, isDouble: teamData.fixtures.length >= 2 };
  });
}

function findRoughPatch(weeks: WeekOutlook[]): PlannerRow["roughPatch"] {
  for (let i = 0; i < weeks.length; i++) {
    const bad = weeks[i].difficulty === null || weeks[i].difficulty! >= TOUGH_THRESHOLD;
    if (!bad) continue;
    let j = i;
    while (j + 1 < weeks.length && (weeks[j + 1].difficulty === null || weeks[j + 1].difficulty! >= TOUGH_THRESHOLD)) {
      j++;
    }
    if (j > i) return { fromEvent: weeks[i].event, toEvent: weeks[j].event };
  }
  return null;
}

/** A one-line, direct call on when to make your move - built from the
 * single worst-affected squad player's own rough patch (already computed
 * for the row list below), rather than leaving the whole table for the
 * visitor to scan themselves. Says so plainly when there's nothing
 * urgent, rather than forcing a confident-sounding deadline out of a
 * squad with no real red flags in the window. */
export function buildPlannerSummary(rows: PlannerRow[]): string {
  const worst = rows[0];
  if (!worst || !worst.roughPatch) {
    return `No real red flags in the next ${WINDOW} gameweeks for your saved squad - nothing urgent to plan a transfer around right now.`;
  }
  const { fromEvent, toEvent } = worst.roughPatch;
  const moveByEvent = Math.max(1, fromEvent - 1);
  const patchText = fromEvent === toEvent ? `GW${fromEvent}` : `GW${fromEvent}–${toEvent}`;
  return `Best window to make your move: Gameweek ${moveByEvent}, before ${worst.player.name}'s fixtures turn (${patchText}).`;
}

/** For a saved squad, a week-by-week fixture outlook over the next few
 * gameweeks, ranked worst-first so the players most worth planning a
 * transfer around surface at the top. */
export function buildPlanner(squadPlayers: Player[], analysis: GameweekAnalysis[]): PlannerRow[] {
  return squadPlayers
    .map((player) => {
      const weeks = outlookFor(analysis, player.teamId);
      const scored = weeks.map((w) => w.difficulty ?? BLANK_PENALTY);
      const avgDifficulty = scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
      return { player, weeks, avgDifficulty, roughPatch: findRoughPatch(weeks) };
    })
    .sort((a, b) => b.avgDifficulty - a.avgDifficulty);
}

/** Gameweeks in the window where a chip is worth thinking about, based on
 * real doubles/blanks affecting the squad's own teams. */
export function findChipWindows(analysis: GameweekAnalysis[], squadTeamIds: Set<number>): WeekFlag[] {
  const flags: WeekFlag[] = [];
  for (const gw of analysis.slice(0, WINDOW)) {
    const present = new Set(gw.teams.map((t) => t.teamId));
    const doublers = gw.teams.filter((t) => squadTeamIds.has(t.teamId) && t.fixtures.length >= 2);
    const blankers = [...squadTeamIds].filter((id) => !present.has(id));

    if (doublers.length > 0) {
      flags.push({
        event: gw.event,
        note: `${doublers.length} of your teams play twice — worth a look for Bench Boost or Triple Captain.`,
      });
    }
    if (blankers.length > 0) {
      flags.push({
        event: gw.event,
        note: `${blankers.length} of your teams don't play — could be a Free Hit gameweek.`,
      });
    }
  }
  return flags;
}
