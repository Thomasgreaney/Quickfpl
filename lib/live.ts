import { readFile } from "node:fs/promises";
import path from "node:path";
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

// Written by scripts/fetch-snapshot.ts on a schedule - already the exact
// DataSnapshot shape buildSnapshot() produces, so it can be served as-is.
const FALLBACK_SNAPSHOT_PATH = path.join(process.cwd(), "data", "latest.json");

/** The official FPL API occasionally 403s or times out on Vercel's build
 * servers even after fetchFplJson's own retries - rather than fail the
 * whole build (and take the live site down to its previous deploy) or a
 * live request, fall back to the last snapshot the scheduled refresh job
 * committed. At most a few hours stale, which beats an outright failure. */
export async function getLiveSnapshot(): Promise<DataSnapshot> {
  try {
    const raw = await fetchFplJson<FplBootstrapStatic>(BOOTSTRAP_URL);
    return buildSnapshot(raw);
  } catch (err) {
    try {
      const fallback = JSON.parse(await readFile(FALLBACK_SNAPSHOT_PATH, "utf-8")) as DataSnapshot;
      console.error("getLiveSnapshot: live fetch failed, falling back to data/latest.json", err);
      return fallback;
    } catch {
      throw err;
    }
  }
}

/** Fixtures have no committed fallback file, so a failure here degrades
 * to an empty list (fixture-difficulty chips and runs just don't show)
 * rather than failing the page or build outright. */
export async function getLiveFixtures(): Promise<FplRawFixture[]> {
  try {
    return await fetchFplJson<FplRawFixture[]>(FIXTURES_URL);
  } catch (err) {
    console.error("getLiveFixtures: live fetch failed, degrading to no fixtures", err);
    return [];
  }
}

/** Every fixture (played, live or upcoming) for one specific gameweek,
 * scores included - unlike getLiveFixtures, which only ever returns
 * fixtures still to come. Used for the gameweek wrap-up's scoreboard. */
export async function getEventFixtures(eventId: number): Promise<FplRawFixture[]> {
  try {
    return await fetchFplJson<FplRawFixture[]>(`${FIXTURES_BASE_URL}?event=${eventId}`);
  } catch (err) {
    console.error(`getEventFixtures(${eventId}): live fetch failed, degrading to no fixtures`, err);
    return [];
  }
}
