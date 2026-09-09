import type {
  FplBootstrapStatic,
  FplRawElement,
  Player,
  Position,
  DataSnapshot,
} from "./fpl-types";

const POSITION_MAP: Record<number, Position> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

function toMillions(tenths: number): number {
  return Math.round(tenths) / 10;
}

export function normalizeElement(
  el: FplRawElement,
  teamName: string,
  teamShort: string
): Player {
  return {
    id: el.id,
    code: el.code,
    name: el.web_name,
    fullName: `${el.first_name} ${el.second_name}`.trim(),
    team: teamName,
    teamShort,
    position: POSITION_MAP[el.element_type] ?? "MID",
    price: toMillions(el.now_cost),
    priceChangeSeason: toMillions(el.cost_change_start),
    priceChangeEvent: toMillions(el.cost_change_event),
    ownership: parseFloat(el.selected_by_percent) || 0,
    form: parseFloat(el.form) || 0,
    totalPoints: el.total_points,
    status: el.status,
    news: el.news,
    transfersInEvent: el.transfers_in_event,
    transfersOutEvent: el.transfers_out_event,
  };
}

export function buildSnapshot(raw: FplBootstrapStatic): DataSnapshot {
  const teamsById = new Map(raw.teams.map((t) => [t.id, t]));
  const players = raw.elements.map((el) => {
    const team = teamsById.get(el.team);
    return normalizeElement(el, team?.name ?? "Unknown", team?.short_name ?? "UNK");
  });
  const currentEvent = raw.events.find((e) => e.is_current) ?? raw.events.find((e) => e.is_next);
  return {
    fetchedAt: new Date().toISOString(),
    currentEventId: currentEvent?.id ?? null,
    players,
  };
}
