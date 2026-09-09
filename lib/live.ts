import type { FplBootstrapStatic, FplRawFixture } from "./fpl-types";
import type { DataSnapshot } from "./fpl-types";
import { buildSnapshot } from "./normalize";

const BOOTSTRAP_URL =
  process.env.FPL_BOOTSTRAP_URL ?? "https://fantasy.premierleague.com/api/bootstrap-static/";
const FIXTURES_URL =
  process.env.FPL_FIXTURES_URL ?? "https://fantasy.premierleague.com/api/fixtures/?future=1";

// Revalidate every 5 minutes so we're not hammering the official API on
// every request, but the table still stays close to real-time.
const REVALIDATE_SECONDS = 300;

export async function getLiveSnapshot(): Promise<DataSnapshot> {
  const res = await fetch(BOOTSTRAP_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { "User-Agent": "quickfpl.app (price tracker)" },
  });

  if (!res.ok) {
    throw new Error(`FPL API responded with ${res.status}`);
  }

  const raw = (await res.json()) as FplBootstrapStatic;
  return buildSnapshot(raw);
}

export async function getLiveFixtures(): Promise<FplRawFixture[]> {
  const res = await fetch(FIXTURES_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { "User-Agent": "quickfpl.app (price tracker)" },
  });

  if (!res.ok) {
    throw new Error(`FPL fixtures API responded with ${res.status}`);
  }

  return (await res.json()) as FplRawFixture[];
}
