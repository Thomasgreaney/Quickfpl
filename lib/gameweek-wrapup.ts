import { readFile } from "node:fs/promises";
import path from "node:path";

const WRAPUP_PATH = path.join(process.cwd(), "data", "gameweek-wrapup.json");

export interface GameweekWrapup {
  eventId: number;
  eventName: string;
  deadlineTime: string;
  generatedAt: string;
  teaser: string;
  fullWriteup: string;
}

/** Reads the most recently generated gameweek wrap-up, if any. Written by
 * scripts/generate-gameweek-wrapup.ts once every fixture in the current
 * gameweek has finished - absent until the first one's been generated, or
 * stale (for a now-finished gameweek) until the next one lands. Callers
 * should check eventId against the gameweek they actually want before
 * showing it. */
export async function readGameweekWrapup(): Promise<GameweekWrapup | null> {
  try {
    const raw = await readFile(WRAPUP_PATH, "utf-8");
    return JSON.parse(raw) as GameweekWrapup;
  } catch {
    return null;
  }
}
