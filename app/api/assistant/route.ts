import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { redis } from "@/lib/redis";
import { memberKey, tierUnlocksTopTier, type MembershipRecord } from "@/lib/membership";
import { getLiveSnapshot, getLiveFixtures } from "@/lib/live";
import { buildFixtureRuns } from "@/lib/fixtures";
import { buildAssistantContext } from "@/lib/assistant-context";
import type { Player } from "@/lib/fpl-types";

const MODEL = "claude-haiku-4-5";
const MAX_QUESTION_LENGTH = 500;
const MAX_SQUAD_IDS = 15;
const MAX_HISTORY_TURNS = 3; // user+assistant pairs kept for conversational context
const MAX_OUTPUT_TOKENS = 300;

const SYSTEM_PROMPT = `You are the QuickFPL AI Assistant, a Fantasy Premier League advisor. Match QuickFPL's tone: blunt, no fluff, straight to the point - like the rest of the site's copy.

Rules:
- Plain text only - no markdown. No asterisks, no bold/italic markers, no bullet points, no headers. This is shown as plain text in a chat bubble, so any markdown symbols would show up literally instead of being formatted.
- Be short: one clear verdict plus one short reason grounded in the actual numbers (form, price, fixture difficulty). Two to three sentences, not a paragraph. Only mention a second player or add a caveat if the question actually asks for it.
- Only use the squad, fixture, form and price data given to you below. Never invent stats for a player not listed there.
- If asked about a player who isn't in the provided data, say plainly you don't have live data on them in this context - don't guess.
- Squad players tagged [BENCH] are the saved substitutes; everyone else in the squad list is the starting XI. This app doesn't track who's captained, so don't assume one.
- Fixture difficulty is 1 (easy) to 5 (hard).`;

let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!anthropic) anthropic = new Anthropic();
  return anthropic;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface AssistantRequestBody {
  email?: string;
  question?: string;
  squadPlayerIds?: number[];
  benchPlayerIds?: number[];
  history?: ChatTurn[];
}

export async function POST(req: Request) {
  let body: AssistantRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const question = body.question?.trim();
  if (!email || !question) {
    return NextResponse.json({ error: "email and question are required" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Question's too long." }, { status: 400 });
  }

  // Server-side membership check - this costs real money per call, so the
  // client-side gate alone isn't enough to protect it.
  const record = await redis.get<MembershipRecord>(memberKey(email));
  if (!record?.active || !tierUnlocksTopTier(record.levelName)) {
    return NextResponse.json({ error: "Fergie membership required" }, { status: 403 });
  }

  const squadPlayerIds = Array.isArray(body.squadPlayerIds) ? body.squadPlayerIds.slice(0, MAX_SQUAD_IDS) : [];
  const benchPlayerIds = Array.isArray(body.benchPlayerIds) ? body.benchPlayerIds.slice(0, MAX_SQUAD_IDS) : [];
  const history: ChatTurn[] = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_TURNS * 2) : [];

  const [snapshot, fixtures] = await Promise.all([getLiveSnapshot(), getLiveFixtures()]);
  const fixturesByTeam = buildFixtureRuns(fixtures, snapshot.teams);
  const byId = new Map(snapshot.players.map((p) => [p.id, p]));
  const squadPlayers = squadPlayerIds.map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));

  const context = buildAssistantContext(
    squadPlayers,
    benchPlayerIds,
    snapshot.players,
    fixturesByTeam,
    snapshot.currentEventId
  );

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((turn) => ({ role: turn.role, content: turn.content })),
        { role: "user" as const, content: `${context}\n\nQuestion: ${question}` },
      ],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    return NextResponse.json({ answer: textBlock?.text ?? "" });
  } catch (err) {
    console.error("Assistant error", err);
    return NextResponse.json({ error: "Couldn't get an answer just now - try again in a bit." }, { status: 502 });
  }
}
