/**
 * Generates the gameweek wrap-up once every fixture in the current
 * gameweek has finished, and writes it to data/gameweek-wrapup.json.
 *
 * Run via `npm run wrapup`. Intended to be triggered on a schedule by
 * .github/workflows/gameweek-wrapup.yml, which commits any resulting
 * change. Safe to run at any time - it's a no-op unless there's a
 * current gameweek, every one of its fixtures is finished, and no
 * wrap-up has been generated for it yet.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { FplBootstrapStatic } from "../lib/fpl-types";
import { buildSnapshot } from "../lib/normalize";
import { fetchFplJson } from "../lib/fpl-fetch";
import { getEventFixtures } from "../lib/live";
import { parsePreviewResponse } from "../lib/gameweek-preview-parse";

const BOOTSTRAP_URL =
  process.env.FPL_BOOTSTRAP_URL ?? "https://fantasy.premierleague.com/api/bootstrap-static/";
const DATA_DIR = path.join(process.cwd(), "data");
const OUTPUT_PATH = path.join(DATA_DIR, "gameweek-wrapup.json");
const MODEL = "claude-opus-5";
// See generate-gameweek-preview.ts for why this needs real headroom above
// the actual ~300-400 words of visible output.
const MAX_OUTPUT_TOKENS = 2000;
const THINKING_EFFORT = "medium";
const TOP_SCORERS_POOL_SIZE = 10;
const PRICE_MOVERS_POOL_SIZE = 10;

interface StoredWrapup {
  eventId: number;
  eventName: string;
  deadlineTime: string;
  generatedAt: string;
  teaser: string;
  fullWriteup: string;
}

async function readExisting(): Promise<StoredWrapup | null> {
  try {
    const raw = await readFile(OUTPUT_PATH, "utf-8");
    return JSON.parse(raw) as StoredWrapup;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You write the QuickFPL gameweek wrap-up - a short recap published once every match in a gameweek has finished. Match QuickFPL's voice: blunt, no fluff, straight-talking, confident but not hyperbolic.

Ground everything in the results and player data you're given - the scores are final and real, and "points this gameweek" is each player's actual score for this gameweek only, not their season total. Don't invent a score or a stat for a player or team not in the data.

Keep it short and simple - readers should be able to skim it in a few seconds. Write in plain paragraphs - no headers, no bullet points. The only markup allowed is wrapping the handful of things that actually matter in double asterisks, e.g. **Haaland** or **14 points** - use it sparingly (a handful of times total across the whole piece), only on player names, team names and standout stats, never on whole sentences.

Respond in exactly this format, with both section labels on their own line:

TEASER:
1-2 short sentences that hook the reader into how the gameweek played out - this part is shown to every visitor, including non-members.

FULL:
The complete wrap-up, for paying members only. Cover, briefly: the standout results worth a mention; 2-3 named players who had a big gameweek by actual points scored; and any notable price movement since the deadline. Ground every claim in the numbers you were given. 2-3 short paragraphs, no padding - every sentence should earn its place.`;

async function main() {
  const raw = await fetchFplJson<FplBootstrapStatic>(BOOTSTRAP_URL);

  const currentEvent = raw.events.find((e) => e.is_current);
  if (!currentEvent) {
    console.log("No current gameweek in progress - nothing to wrap up.");
    return;
  }

  const existing = await readExisting();
  if (existing?.eventId === currentEvent.id) {
    console.log(`Already generated a wrap-up for gameweek ${currentEvent.id} - skipping.`);
    return;
  }

  const fixtures = await getEventFixtures(currentEvent.id);
  if (fixtures.length === 0) {
    console.log(`No fixtures found for gameweek ${currentEvent.id} - skipping.`);
    return;
  }
  if (!fixtures.every((f) => f.finished)) {
    console.log(`Gameweek ${currentEvent.id} still has matches in progress - skipping.`);
    return;
  }

  const snapshot = buildSnapshot(raw);
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));
  const playersById = new Map(snapshot.players.map((p) => [p.id, p]));

  const resultLines = fixtures.map((f) => {
    const home = teamsById.get(f.team_h);
    const away = teamsById.get(f.team_a);
    return `${home?.short ?? "?"} ${f.team_h_score ?? 0}-${f.team_a_score ?? 0} ${away?.short ?? "?"}`;
  });

  const topScorers = [...raw.elements]
    .sort((a, b) => b.event_points - a.event_points)
    .slice(0, TOP_SCORERS_POOL_SIZE)
    .map((el) => {
      const player = playersById.get(el.id);
      return `${player?.name ?? el.web_name} (${player?.position ?? "?"}, ${player?.teamShort ?? "?"}) - ${el.event_points} pts this gameweek, £${(player?.price ?? 0).toFixed(1)}m`;
    });

  const movers = [...snapshot.players]
    .filter((p) => p.priceChangeEvent !== 0)
    .sort((a, b) => Math.abs(b.priceChangeEvent) - Math.abs(a.priceChangeEvent))
    .slice(0, PRICE_MOVERS_POOL_SIZE)
    .map(
      (p) =>
        `${p.name} (${p.teamShort}) - ${p.priceChangeEvent > 0 ? "+" : "-"}£${Math.abs(p.priceChangeEvent).toFixed(1)}m, now £${p.price.toFixed(1)}m`
    );

  const context = `Gameweek: ${currentEvent.name}
Deadline: ${currentEvent.deadline_time}

FINAL SCORES:
${resultLines.join("\n")}

TOP PERFORMERS THIS GAMEWEEK (by actual gameweek points):
${topScorers.join("\n")}

NOTABLE PRICE MOVES SINCE THE DEADLINE:
${movers.length > 0 ? movers.join("\n") : "None of note."}`;

  console.log("Calling Claude to generate the wrap-up...");
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    output_config: { effort: THINKING_EFFORT },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: context }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Claude's response hit the max_tokens limit before finishing - the stored wrap-up would be truncated mid-sentence, so treating this as a failure rather than writing a broken file."
    );
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("Claude returned no text content for the gameweek wrap-up.");
  }

  const { teaser, fullWriteup } = parsePreviewResponse(textBlock.text);

  const stored: StoredWrapup = {
    eventId: currentEvent.id,
    eventName: currentEvent.name,
    deadlineTime: currentEvent.deadline_time,
    generatedAt: new Date().toISOString(),
    teaser,
    fullWriteup,
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(stored, null, 2) + "\n", "utf-8");
  console.log(`Wrote wrap-up for ${currentEvent.name} to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
