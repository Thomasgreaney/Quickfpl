import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { memberKey, tierUnlocksPremium, type MembershipRecord } from "@/lib/membership";
import { fetchFplJson } from "@/lib/fpl-fetch";
import { getLiveSnapshot } from "@/lib/live";
import { simulateLeague, type LeagueEntry } from "@/lib/league-simulator";
import type { FplLeagueStandings } from "@/lib/fpl-types";

const STANDINGS_URL = (leagueId: number) =>
  `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;

const MAX_ENTRIES = 20;

interface SimulatorRequestBody {
  email?: string;
  leagueId?: number;
}

export async function POST(req: Request) {
  let body: SimulatorRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const leagueId = body.leagueId;
  if (!email || !Number.isInteger(leagueId) || leagueId! <= 0 || leagueId! > 99_999_999) {
    return NextResponse.json({ error: "email and a valid leagueId are required" }, { status: 400 });
  }

  // Server-side membership check - this hits the shared FPL API on the
  // user's behalf, so it stays gated to stop it being hammered anonymously.
  const record = await redis.get<MembershipRecord>(memberKey(email));
  if (!record?.active || !tierUnlocksPremium(record.levelName)) {
    return NextResponse.json({ error: "Pep or Fergie membership required" }, { status: 403 });
  }

  try {
    const [standings, snapshot] = await Promise.all([
      fetchFplJson<FplLeagueStandings>(STANDINGS_URL(leagueId!)),
      getLiveSnapshot(),
    ]);

    const results = standings.standings.results.slice(0, MAX_ENTRIES);
    if (results.length === 0) {
      return NextResponse.json({ error: "That league has no entries yet." }, { status: 404 });
    }

    const entries: LeagueEntry[] = results.map((r) => ({
      entryId: r.entry,
      teamName: r.entry_name,
      managerName: r.player_name,
      currentRank: r.rank,
      currentTotal: r.total,
    }));

    const gameweeksPlayed = Math.max(0, (snapshot.currentEventId ?? 1) - 1);
    const simulated = simulateLeague(entries, gameweeksPlayed);

    return NextResponse.json({
      leagueName: standings.league.name,
      totalEntries: standings.standings.results.length,
      shownEntries: results.length,
      gameweeksPlayed,
      entries: simulated,
    });
  } catch (err) {
    console.error("League simulator error", err);
    return NextResponse.json(
      { error: "Couldn't reach the FPL league standings just now - check the league ID and try again." },
      { status: 502 }
    );
  }
}
