import type { ChipType } from "./chips";

// The chip tracker (free, on /squad) and the chip analysis (Pep-tier, on
// /planner) are now separate pages, so "which chips are left" has to be
// shared via localStorage instead of local component state - same pattern
// as SQUAD_STORAGE_KEY/SQUAD_UPDATED_EVENT in squad-storage.ts.
export const CHIPS_USED_STORAGE_KEY = "quickfpl-chips-used";
export const CHIPS_USED_UPDATED_EVENT = "quickfpl-chips-used-updated";

const ALL_CHIPS: ChipType[] = ["wildcard", "freehit", "benchboost", "triplecaptain"];

function isChipType(value: unknown): value is ChipType {
  return typeof value === "string" && (ALL_CHIPS as string[]).includes(value);
}

/** Chips marked as already used. Everything not in this set is "remaining". */
export function readUsedChips(): Set<ChipType> {
  try {
    const raw = window.localStorage.getItem(CHIPS_USED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(isChipType));
  } catch {
    return new Set();
  }
}

export function writeUsedChips(used: Set<ChipType>): void {
  try {
    window.localStorage.setItem(CHIPS_USED_STORAGE_KEY, JSON.stringify([...used]));
    window.dispatchEvent(new Event(CHIPS_USED_UPDATED_EVENT));
  } catch {
    // storage unavailable - the toggle just won't persist across reloads
  }
}
