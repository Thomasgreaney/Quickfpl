import type {
  FplBootstrapStatic,
  FplRawElement,
  FplRawTeam,
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

function derivePhotoId(el: FplRawElement): string {
  const match = el.photo?.match(/^(\d+)\./);
  return match ? match[1] : String(el.code);
}

export function normalizeElement(el: FplRawElement, team: FplRawTeam): Player {
  return {
    id: el.id,
    code: el.code,
    photoId: derivePhotoId(el),
    name: el.web_name,
    fullName: `${el.first_name} ${el.second_name}`.trim(),
    team: team.name,
    teamShort: team.short_name,
    teamId: team.id,
    position: POSITION_MAP[el.element_type] ?? "MID",
    price: toMillions(el.now_cost),
    priceChangeSeason: toMillions(el.cost_change_start),
    priceChangeEvent: toMillions(el.cost_change_event),
    ownership: parseFloat(el.selected_by_percent) || 0,
    form: parseFloat(el.form) || 0,
    totalPoints: el.total_points,
    status: el.status,
    news: el.news,
    chanceOfPlayingNextRound: el.chance_of_playing_next_round,
    transfersInEvent: el.transfers_in_event,
    transfersOutEvent: el.transfers_out_event,
  };
}

const UNKNOWN_TEAM: FplRawTeam = { id: 0, name: "Unknown", short_name: "UNK" };

export function buildSnapshot(raw: FplBootstrapStatic): DataSnapshot {
  const teamsById = new Map(raw.teams.map((t) => [t.id, t]));
  const players = raw.elements.map((el) => normalizeElement(el, teamsById.get(el.team) ?? UNKNOWN_TEAM));
  const currentEvent = raw.events.find((e) => e.is_current) ?? raw.events.find((e) => e.is_next);
  const nextEvent = raw.events.find((e) => e.is_next) ?? raw.events.find((e) => !e.finished) ?? null;
  return {
    fetchedAt: new Date().toISOString(),
    currentEventId: currentEvent?.id ?? null,
    nextEventId: nextEvent?.id ?? null,
    nextEventName: nextEvent?.name ?? null,
    nextDeadlineTime: nextEvent?.deadline_time ?? null,
    players,
    teams: raw.teams.map((t) => ({ id: t.id, name: t.name, short: t.short_name })),
  };
}
