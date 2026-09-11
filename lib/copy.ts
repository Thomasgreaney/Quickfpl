import type { Player } from "./fpl-types";

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtForm(n: number): string {
  return n.toFixed(1);
}

const HIGH_OWNERSHIP = 25; // percent - "the crowd already owns this"
const MID_OWNERSHIP = 10; // percent - "building real momentum" vs. still a differential
const HIGH_FORM = 6; // FPL form scale is roughly 0-10
const LOW_FORM = 3;

/** True for anything short of fully fit ('a'vailable) - injured, doubtful,
 * suspended, unavailable. */
function isFlagged(player: Player): boolean {
  return player.status !== "a";
}

/** Short, blunt one-liners for movers - grounded in each player's actual
 * ownership, form, transfer momentum and injury news, not a fixed set of
 * canned phrases, so two players in the same "direction" read differently
 * when their numbers differ. */
export function getVerdict(player: Player, direction: "up" | "down"): string {
  const { ownership, form, transfersInEvent, transfersOutEvent, news } = player;
  const flagged = isFlagged(player) && news.trim().length > 0;

  if (direction === "up") {
    if (flagged) {
      return `Rising anyway, despite a fitness concern. News: ${news}`;
    }
    if (ownership >= HIGH_OWNERSHIP) {
      return `${fmtPct(ownership)} owned and still climbing - form's at ${fmtForm(form)}, so this isn't a fluke.`;
    }
    if (ownership >= MID_OWNERSHIP) {
      return `${fmtPct(ownership)} owned with ${transfersInEvent.toLocaleString()} transfers in this week - real momentum building.`;
    }
    if (form >= HIGH_FORM) {
      return `Just ${fmtPct(ownership)} owned but form's at ${fmtForm(form)} - a genuine differential before the price catches up.`;
    }
    return `Only ${fmtPct(ownership)} owned - climbing quietly. Worth watching before it gets pricier.`;
  }

  // direction === "down"
  if (flagged) {
    return `Falling, and the injury news explains why. News: ${news}`;
  }
  if (ownership >= HIGH_OWNERSHIP) {
    return `${fmtPct(ownership)} still own it and it's losing value fast - form's dropped to ${fmtForm(form)}. Decide now.`;
  }
  if (ownership >= MID_OWNERSHIP) {
    return `${fmtPct(ownership)} owned and falling, with ${transfersOutEvent.toLocaleString()} transfers out this week already.`;
  }
  if (form <= LOW_FORM) {
    return `Form's crashed to ${fmtForm(form)} and only ${fmtPct(ownership)} owned - nobody's rushing to save it.`;
  }
  return `Falling despite okay form (${fmtForm(form)}) - just sentiment turning against it at ${fmtPct(ownership)} owned.`;
}
