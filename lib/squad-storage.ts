// Shared localStorage key + change event so independent client components
// (SquadBuilder, ChipStrategy) stay in sync without lifting state up.
export const SQUAD_STORAGE_KEY = "quickfpl-squad";
export const SQUAD_UPDATED_EVENT = "quickfpl-squad-updated";

// Only these hold player ids that make up the 15-man squad. "bench" (added
// alongside these) marks 4 of the same ids as substitutes rather than
// adding new ones, so it's deliberately excluded here to avoid double-
// counting them.
const POSITION_KEYS = ["GKP", "DEF", "MID", "FWD"];

/** Flattens the squad's position->ids structure into a plain list of player ids. */
export function readSquadPlayerIds(): number[] {
  try {
    const raw = window.localStorage.getItem(SQUAD_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const ids: number[] = [];
    if (parsed && typeof parsed === "object") {
      for (const key of POSITION_KEYS) {
        const value = (parsed as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          for (const id of value) if (typeof id === "number") ids.push(id);
        }
      }
    }
    return ids;
  } catch {
    return [];
  }
}

/** The subset of the saved squad currently marked as bench/substitutes. */
export function readBenchPlayerIds(): number[] {
  try {
    const raw = window.localStorage.getItem(SQUAD_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];
    const bench = (parsed as Record<string, unknown>).bench;
    return Array.isArray(bench) ? bench.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}
