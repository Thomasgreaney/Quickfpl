import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchFplJson } from "@/lib/fpl-fetch";
import { getLiveSnapshot } from "@/lib/live";
import { simulateLeague, type LeagueEntry } from "@/lib/league-simulator";
import type { FplLeagueStandings } from "@/lib/fpl-types";

const STANDINGS_URL = (leagueId: number) =>
  `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;

const MAX_ENTRIES = 20;
const MAX_SIMULATIONS_PER_IP_PER_DAY = 20;

interface SimulatorRequestBody {
  leagueId?: number;
}

export async function POST(req: Request) {
  let body: SimulatorRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const leagueId = body.leagueId;
  if (!Number.isInteger(leagueId) || leagueId! <= 0 || leagueId! > 99_999_999) {
    return NextResponse.json({ error: "a valid leagueId is required" }, { status: 400 });
  }

  // Free for everyone, but this hits a third-party API (FPL's) on the
  // visitor's behalf - a per-IP daily cap stops it being hammered
  // anonymously and getting our server rate-limited or blocked by FPL.
  const allowed = await checkRateLimit("league-sim", getClientIp(req), MAX_SIMULATIONS_PER_IP_PER_DAY);
  if (!allowed) {
    return NextResponse.json(
      { error: "That's the limit of simulations for today from this connection - try again tomorrow." },
      { status: 429 }
    );
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
