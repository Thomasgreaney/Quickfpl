import { readFile } from "node:fs/promises";
import path from "node:path";
import type { HistoryFile, HistorySnapshot } from "./fpl-types";

const HISTORY_PATH = path.join(process.cwd(), "data", "history.json");

export async function readHistory(): Promise<HistoryFile> {
  try {
    const raw = await readFile(HISTORY_PATH, "utf-8");
    return JSON.parse(raw) as HistoryFile;
  } catch {
    return { snapshots: [] };
  }
}

export interface RecentMove {
  playerId: number;
  deltaTenths: number; // now_cost delta, tenths of a million
}

/** Compares the two most recent snapshots we've taken ourselves and returns
 * per-player price deltas. Empty if we don't have at least two snapshots yet. */
export function diffLatestTwo(history: HistoryFile): {
  from: HistorySnapshot | null;
  to: HistorySnapshot | null;
  moves: RecentMove[];
} {
  const snapshots = history.snapshots;
  if (snapshots.length < 2) {
    return { from: null, to: null, moves: [] };
  }
  const to = snapshots[snapshots.length - 1];
  const from = snapshots[snapshots.length - 2];

  const moves: RecentMove[] = [];
  for (const [idStr, toPrice] of Object.entries(to.prices)) {
    const id = Number(idStr);
    const fromPrice = from.prices[id];
    if (fromPrice === undefined) continue;
    const delta = toPrice - fromPrice;
    if (delta !== 0) moves.push({ playerId: id, deltaTenths: delta });
  }
  return { from, to, moves };
}

export interface PricePoint {
  fetchedAt: string;
  price: number; // £m
}

/** Chronological price series for one player, from our own snapshot history. */
export function getPriceSeries(history: HistoryFile, playerId: number): PricePoint[] {
  const points: PricePoint[] = [];
  for (const snap of history.snapshots) {
    const tenths = snap.prices[playerId];
    if (tenths === undefined) continue;
    points.push({ fetchedAt: snap.fetchedAt, price: Math.round(tenths) / 10 });
  }
  return points;
}
