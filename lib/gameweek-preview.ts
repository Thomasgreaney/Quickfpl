import { readFile } from "node:fs/promises";
import path from "node:path";

const PREVIEW_PATH = path.join(process.cwd(), "data", "gameweek-preview.json");

export interface GameweekPreview {
  eventId: number;
  eventName: string;
  deadlineTime: string;
  generatedAt: string;
  teaser: string;
  fullWriteup: string;
}

/** Reads the most recently generated gameweek preview, if any. Written by
 * scripts/generate-gameweek-preview.ts on a schedule - absent entirely
 * until the first one's been generated, or stale between gameweeks until
 * the next one lands. */
export async function readGameweekPreview(): Promise<GameweekPreview | null> {
  try {
    const raw = await readFile(PREVIEW_PATH, "utf-8");
    return JSON.parse(raw) as GameweekPreview;
  } catch {
    return null;
  }
}

/** Whether a stored preview's deadline is still in the future - once it
 * isn't, the preview is stale and callers should fall back to the
 * wrap-up for whatever gameweek is now in progress instead. Kept as a
 * plain helper (rather than inlined in a component) since components must
 * stay pure and can't call Date.now() directly in their render body. */
export function isPreviewCurrent(preview: GameweekPreview | null): boolean {
  return Boolean(preview && Date.parse(preview.deadlineTime) > Date.now());
}
