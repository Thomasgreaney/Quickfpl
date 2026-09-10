import type { FplBootstrapStatic, FplRawFixture } from "./fpl-types";
import type { DataSnapshot } from "./fpl-types";
import { buildSnapshot } from "./normalize";
import { fetchFplJson } from "./fpl-fetch";

const BOOTSTRAP_URL =
  process.env.FPL_BOOTSTRAP_URL ?? "https://fantasy.premierleague.com/api/bootstrap-static/";
const FIXTURES_URL =
  process.env.FPL_FIXTURES_URL ?? "https://fantasy.premierleague.com/api/fixtures/?future=1";

export async function getLiveSnapshot(): Promise<DataSnapshot> {
  const raw = await fetchFplJson<FplBootstrapStatic>(BOOTSTRAP_URL);
  return buildSnapshot(raw);
}

export async function getLiveFixtures(): Promise<FplRawFixture[]> {
  return fetchFplJson<FplRawFixture[]>(FIXTURES_URL);
}
