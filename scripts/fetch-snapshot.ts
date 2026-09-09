/**
 * Fetches the current FPL bootstrap-static payload, writes it to
 * data/latest.json, and appends a lightweight price snapshot to
 * data/history.json so we can detect changes over time.
 *
 * Run via `npm run refresh`. Intended to be triggered on a schedule by
 * .github/workflows/refresh-data.yml, which commits any resulting changes.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FplBootstrapStatic, HistoryFile, HistorySnapshot } from "../lib/fpl-types";
import { buildSnapshot } from "../lib/normalize";

const BOOTSTRAP_URL =
  process.env.FPL_BOOTSTRAP_URL ?? "https://fantasy.premierleague.com/api/bootstrap-static/";
const DATA_DIR = path.join(process.cwd(), "data");
const LATEST_PATH = path.join(DATA_DIR, "latest.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

// Keep roughly a month of history at an 8x/day cadence before pruning.
const MAX_SNAPSHOTS = 240;

async function readHistory(): Promise<HistoryFile> {
  try {
    const raw = await readFile(HISTORY_PATH, "utf-8");
    return JSON.parse(raw) as HistoryFile;
  } catch {
    return { snapshots: [] };
  }
}

async function main() {
  console.log(`Fetching ${BOOTSTRAP_URL} ...`);
  const res = await fetch(BOOTSTRAP_URL, {
    headers: { "User-Agent": "quickfpl.app (price tracker snapshot job)" },
  });
  if (!res.ok) {
    throw new Error(`FPL API responded with ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as FplBootstrapStatic;
  const snapshot = buildSnapshot(raw);

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LATEST_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${snapshot.players.length} players to ${path.relative(process.cwd(), LATEST_PATH)}`);

  const history = await readHistory();
  const prices: Record<number, number> = {};
  for (const el of raw.elements) prices[el.id] = el.now_cost;

  const entry: HistorySnapshot = { fetchedAt: snapshot.fetchedAt, prices };
  history.snapshots.push(entry);
  if (history.snapshots.length > MAX_SNAPSHOTS) {
    history.snapshots = history.snapshots.slice(-MAX_SNAPSHOTS);
  }

  await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n", "utf-8");
  console.log(
    `Appended snapshot to history (${history.snapshots.length}/${MAX_SNAPSHOTS} kept).`
  );

  if (history.snapshots.length >= 2) {
    const prev = history.snapshots[history.snapshots.length - 2];
    let moved = 0;
    for (const [id, price] of Object.entries(prices)) {
      if (prev.prices[Number(id)] !== undefined && prev.prices[Number(id)] !== price) {
        moved++;
      }
    }
    console.log(`${moved} player(s) changed price since the previous snapshot.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
