/**
 * Generates the gameweek preview write-up once we're within ~2 days of the
 * next gameweek's deadline, and writes it to data/gameweek-preview.json.
 *
 * Run via `npm run preview`. Intended to be triggered on a schedule by
 * .github/workflows/gameweek-preview.yml, which commits any resulting
 * change. Safe to run at any time - it's a no-op outside the preview
 * window or once a gameweek's preview already exists.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { FplBootstrapStatic, FplRawFixture } from "../lib/fpl-types";
import { buildSnapshot } from "../lib/normalize";
import { fetchFplJson } from "../lib/fpl-fetch";
import { parsePreviewResponse } from "../lib/gameweek-preview-parse";

const BOOTSTRAP_URL =
  process.env.FPL_BOOTSTRAP_URL ?? "https://fantasy.premierleague.com/api/bootstrap-static/";
const FIXTURES_URL =
  process.env.FPL_FIXTURES_URL ?? "https://fantasy.premierleague.com/api/fixtures/?future=1";
const DATA_DIR = path.join(process.cwd(), "data");
const OUTPUT_PATH = path.join(DATA_DIR, "gameweek-preview.json");
const MODEL = "claude-opus-5";
const MAX_OUTPUT_TOKENS = 2000;
const IN_FORM_POOL_SIZE = 25;

// Generate once the deadline is within this window. Wide enough that a
// daily cron can't skip past it, narrow enough that it still lands close
// to "2 days before".
const WINDOW_MIN_HOURS = 0;
const WINDOW_MAX_HOURS = 60;

interface StoredPreview {
  eventId: number;
  eventName: string;
  deadlineTime: string;
  generatedAt: string;
  teaser: string;
  fullWriteup: string;
}

async function readExisting(): Promise<StoredPreview | null> {
  try {
    const raw = await readFile(OUTPUT_PATH, "utf-8");
    return JSON.parse(raw) as StoredPreview;
  } catch {
    return null;
  }
}

function difficultyLabel(d: number): string {
  if (d <= 2) return "kind";
  if (d === 3) return "average";
  return "tough";
}

const SYSTEM_PROMPT = `You write the QuickFPL gameweek preview - a short article published about 2 days before each gameweek's deadline. Match QuickFPL's voice: blunt, no fluff, straight-talking, confident but not hyperbolic.

Ground everything in the fixture and form data you're given - the fixture difficulty ratings are FPL's own, not your guess, and "in form" is drawn from real recent scoring. Don't invent stats for a player or team not in the data. Never use markdown - no asterisks, no bold/italic markers, no headers, no bullet points. Write in plain paragraphs.

Respond in exactly this format, with both section labels on their own line:

TEASER:
2-3 sentences that hook the reader into the gameweek without giving away the specific predictions - this part is shown to every visitor, including non-members.

FULL:
The complete preview, for paying members only. Cover: which teams look set for a good gameweek based on their fixture difficulty and which face a tough one; a handful of named players in good form with kind fixtures who look set to return well; and a differential or two worth a punt (lower-owned, good form, kind fixture). Ground every claim in the numbers you were given. Aim for 4-6 short paragraphs.`;

async function main() {
  const raw = await fetchFplJson<FplBootstrapStatic>(BOOTSTRAP_URL);

  const nextEvent = raw.events.find((e) => e.is_next) ?? raw.events.find((e) => !e.finished);
  if (!nextEvent) {
    console.log("No upcoming gameweek found - nothing to preview.");
    return;
  }

  const hoursUntilDeadline = (Date.parse(nextEvent.deadline_time) - Date.now()) / (1000 * 60 * 60);
  console.log(
    `Next gameweek: ${nextEvent.name} (id ${nextEvent.id}), deadline in ${hoursUntilDeadline.toFixed(1)}h`
  );

  if (hoursUntilDeadline < WINDOW_MIN_HOURS || hoursUntilDeadline > WINDOW_MAX_HOURS) {
    console.log(`Outside the ${WINDOW_MIN_HOURS}-${WINDOW_MAX_HOURS}h preview window - skipping.`);
    return;
  }

  const existing = await readExisting();
  if (existing?.eventId === nextEvent.id) {
    console.log(`Already generated a preview for gameweek ${nextEvent.id} - skipping.`);
    return;
  }

  const fixtures = await fetchFplJson<FplRawFixture[]>(FIXTURES_URL);
  const snapshot = buildSnapshot(raw);
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));

  const gwFixtures = fixtures.filter((f) => f.event === nextEvent.id);
  if (gwFixtures.length === 0) {
    console.log(`No fixtures published yet for gameweek ${nextEvent.id} - skipping.`);
    return;
  }

  const fixtureLines = gwFixtures.map((f) => {
    const home = teamsById.get(f.team_h);
    const away = teamsById.get(f.team_a);
    return `${home?.short ?? "?"} (home, difficulty ${f.team_h_difficulty}/5, ${difficultyLabel(f.team_h_difficulty)}) vs ${away?.short ?? "?"} (away, difficulty ${f.team_a_difficulty}/5, ${difficultyLabel(f.team_a_difficulty)})`;
  });

  const inFormPlayers = [...snapshot.players]
    .filter((p) => p.status === "a")
    .sort((a, b) => b.form - a.form)
    .slice(0, IN_FORM_POOL_SIZE)
    .map(
      (p) =>
        `${p.name} (${p.position}, ${p.teamShort}) - form ${p.form.toFixed(1)}, £${p.price.toFixed(1)}m, ${p.ownership.toFixed(1)}% owned`
    );

  const context = `Gameweek: ${nextEvent.name}
Deadline: ${nextEvent.deadline_time}

FIXTURES THIS GAMEWEEK:
${fixtureLines.join("\n")}

PLAYERS IN GOOD FORM RIGHT NOW (top ${inFormPlayers.length} by current form):
${inFormPlayers.join("\n")}`;

  console.log("Calling Claude to generate the preview...");
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: context }],
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("Claude returned no text content for the gameweek preview.");
  }

  const { teaser, fullWriteup } = parsePreviewResponse(textBlock.text);

  const stored: StoredPreview = {
    eventId: nextEvent.id,
    eventName: nextEvent.name,
    deadlineTime: nextEvent.deadline_time,
    generatedAt: new Date().toISOString(),
    teaser,
    fullWriteup,
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(stored, null, 2) + "\n", "utf-8");
  console.log(`Wrote preview for ${nextEvent.name} to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
