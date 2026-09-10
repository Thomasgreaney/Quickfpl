import type { FixtureRun, Player } from "./fpl-types";

const WATCHLIST_SIZE = 20;
const FIXTURES_TO_SHOW = 3;

const STATUS_LABEL: Record<string, string> = {
  i: "INJURED",
  d: "DOUBT",
  s: "SUSPENDED",
  u: "UNAVAILABLE",
};

function formatPlayer(p: Player, fixtures: FixtureRun[] | undefined): string {
  const fixtureText =
    fixtures && fixtures.length > 0
      ? fixtures
          .slice(0, FIXTURES_TO_SHOW)
          .map((f) => `${f.opponentShort}(${f.isHome ? "H" : "A"},diff${f.difficulty})`)
          .join(" ")
      : "no fixtures listed";
  const statusText = p.status !== "a" ? ` [${STATUS_LABEL[p.status] ?? "AVAILABILITY DOUBT"}]` : "";
  return `${p.name} (${p.position}, ${p.teamShort}) - £${p.price.toFixed(1)}m, form ${p.form.toFixed(1)}, ${p.totalPoints}pts, ${p.ownership.toFixed(1)}% owned, next: ${fixtureText}${statusText}`;
}

/** Builds the grounding context sent to Claude for one assistant query -
 * the user's saved squad plus a compact "in-form" pool for transfer
 * suggestions, kept small on purpose to control per-query cost. */
export function buildAssistantContext(
  squadPlayers: Player[],
  allPlayers: Player[],
  fixturesByTeam: Record<number, FixtureRun[]>,
  currentEventId: number | null
): string {
  const squadIds = new Set(squadPlayers.map((p) => p.id));
  const watchlist = [...allPlayers]
    .filter((p) => !squadIds.has(p.id) && p.status === "a")
    .sort((a, b) => b.form - a.form)
    .slice(0, WATCHLIST_SIZE);

  const squadLines =
    squadPlayers.length > 0
      ? squadPlayers.map((p) => `- ${formatPlayer(p, fixturesByTeam[p.teamId])}`).join("\n")
      : "(no squad saved)";

  const watchlistLines = watchlist.map((p) => `- ${formatPlayer(p, fixturesByTeam[p.teamId])}`).join("\n");

  return `Current gameweek: ${currentEventId ?? "unknown"}

SAVED SQUAD (${squadPlayers.length} players - this is the full squad; this app does not track which 11 are starting, who's benched, or who's captained):
${squadLines}

PLAYERS IN GOOD FORM RIGHT NOW (top ${watchlist.length} by current form, not already in the squad - for transfer suggestions; this is not the full player pool):
${watchlistLines}`;
}
