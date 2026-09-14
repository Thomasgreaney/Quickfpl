import type { FplBootstrapStatic, FplRawFixture } from "./fpl-types";
import type { DataSnapshot } from "./fpl-types";
import { buildSnapshot } from "./normalize";
import { fetchFplJson } from "./fpl-fetch";

const BOOTSTRAP_URL =
  process.env.FPL_BOOTSTRAP_URL ?? "https://fantasy.premierleague.com/api/bootstrap-static/";
const FIXTURES_URL =
  process.env.FPL_FIXTURES_URL ?? "https://fantasy.premierleague.com/api/fixtures/?future=1";
const FIXTURES_BASE_URL =
  process.env.FPL_FIXTURES_BASE_URL ?? "https://fantasy.premierleague.com/api/fixtures/";

export async function getLiveSnapshot(): Promise<DataSnapshot> {
  const raw = await fetchFplJson<FplBootstrapStatic>(BOOTSTRAP_URL);
  return buildSnapshot(raw);
}

export async function getLiveFixtures(): Promise<FplRawFixture[]> {
  return fetchFplJson<FplRawFixture[]>(FIXTURES_URL);
}

/** Every fixture (played, live or upcoming) for one specific gameweek,
 * scores included - unlike getLiveFixtures, which only ever returns
 * fixtures still to come. Used for the gameweek wrap-up's scoreboard. */
export async function getEventFixtures(eventId: number): Promise<FplRawFixture[]> {
  return fetchFplJson<FplRawFixture[]>(`${FIXTURES_BASE_URL}?event=${eventId}`);
}
