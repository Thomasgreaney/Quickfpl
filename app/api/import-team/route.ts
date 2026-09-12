import { NextResponse } from "next/server";
import { fetchFplJson } from "@/lib/fpl-fetch";
import { getLiveSnapshot } from "@/lib/live";
import type { Position } from "@/lib/fpl-types";

const ENTRY_URL = (teamId: number) => `https://fantasy.premierleague.com/api/entry/${teamId}/`;
const PICKS_URL = (teamId: number, eventId: number) =>
  `https://fantasy.premierleague.com/api/entry/${teamId}/event/${eventId}/picks/`;

interface FplEntry {
  name: string;
  player_first_name: string;
  player_last_name: string;
}

interface FplPick {
  element: number;
  position: number; // 1-15; 1-11 is the starting XI, 12-15 is the bench
}

interface FplPicksResponse {
  picks: FplPick[];
}

interface ImportRequestBody {
  teamId?: number;
}

export async function POST(req: Request) {
  let body: ImportRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const teamId = body.teamId;
  if (!Number.isInteger(teamId) || teamId! <= 0 || teamId! > 99_999_999) {
    return NextResponse.json({ error: "Enter a valid team ID." }, { status: 400 });
  }

  try {
    const snapshot = await getLiveSnapshot();
    const eventId = snapshot.currentEventId ?? snapshot.nextEventId;
    if (!eventId) {
      return NextResponse.json(
        { error: "No gameweek data available to import picks for right now - try again later." },
        { status: 502 }
      );
    }

    const [entry, picksRes] = await Promise.all([
      fetchFplJson<FplEntry>(ENTRY_URL(teamId!)),
      fetchFplJson<FplPicksResponse>(PICKS_URL(teamId!, eventId)),
    ]);

    if (picksRes.picks.length === 0) {
      return NextResponse.json(
        { error: "That team hasn't set a squad for the current gameweek yet." },
        { status: 404 }
      );
    }

    const byId = new Map(snapshot.players.map((p) => [p.id, p]));
    const squad: Record<Position, number[]> = { GKP: [], DEF: [], MID: [], FWD: [] };
    const bench: number[] = [];

    for (const pick of picksRes.picks) {
      const player = byId.get(pick.element);
      if (!player) continue;
      squad[player.position].push(pick.element);
      if (pick.position > 11) bench.push(pick.element);
    }

    return NextResponse.json({
      teamName: entry.name,
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      squad,
      bench,
    });
  } catch (err) {
    console.error("Import team error", err);
    return NextResponse.json(
      { error: "Couldn't find that team - double check the ID and try again." },
      { status: 404 }
    );
  }
}
