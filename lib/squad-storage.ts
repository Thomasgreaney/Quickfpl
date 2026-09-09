// Shared localStorage key + change event so independent client components
// (SquadBuilder, ChipStrategy) stay in sync without lifting state up.
export const SQUAD_STORAGE_KEY = "quickfpl-squad";
export const SQUAD_UPDATED_EVENT = "quickfpl-squad-updated";

/** Flattens the squad's position->ids structure into a plain list of player ids. */
export function readSquadPlayerIds(): number[] {
  try {
    const raw = window.localStorage.getItem(SQUAD_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const ids: number[] = [];
    if (parsed && typeof parsed === "object") {
      for (const value of Object.values(parsed)) {
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
