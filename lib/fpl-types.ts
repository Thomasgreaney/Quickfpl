// Minimal shape of https://fantasy.premierleague.com/api/bootstrap-static/
// Only the fields we actually use are typed.

export interface FplRawElement {
  id: number;
  code: number;
  photo: string; // e.g. "58723.jpg" - the id used by the photo CDN, not always equal to `code`
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number; // tenths of a million, e.g. 55 => £5.5m
  cost_change_start: number; // tenths of a million change since season start
  cost_change_start_fall: number;
  cost_change_event: number; // tenths of a million change since last gameweek
  cost_change_event_fall: number;
  selected_by_percent: string;
  form: string;
  total_points: number;
  status: string; // 'a' available, 'i' injured, 'd' doubtful, 's' suspended, 'u' unavailable
  news: string;
  chance_of_playing_next_round: number | null;
  points_per_game: string;
  transfers_in_event: number;
  transfers_out_event: number;
}

export interface FplRawTeam {
  id: number;
  name: string;
  short_name: string;
}

export interface FplRawElementType {
  id: number;
  singular_name_short: string; // GKP, DEF, MID, FWD
}

export interface FplBootstrapStatic {
  elements: FplRawElement[];
  teams: FplRawTeam[];
  element_types: FplRawElementType[];
  events: { id: number; is_current: boolean; is_next: boolean; name: string; deadline_time: string; finished: boolean }[];
}

export interface FplRawFixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
  kickoff_time: string | null;
}

export type Position = "GKP" | "DEF" | "MID" | "FWD";

export interface Player {
  id: number;
  code: number;
  photoId: string; // for the CDN photo URL - from the raw `photo` field, not `code`
  name: string;
  fullName: string;
  team: string;
  teamShort: string;
  teamId: number;
  position: Position;
  price: number; // in £m, e.g. 5.5
  priceChangeSeason: number; // £m change since season start
  priceChangeEvent: number; // £m change since last gameweek
  ownership: number; // percent
  form: number;
  totalPoints: number;
  status: string;
  news: string;
  chanceOfPlayingNextRound: number | null; // FPL's own published percent, when they've set one
  transfersInEvent: number;
  transfersOutEvent: number;
}

export interface PlayerWithSparkline extends Player {
  sparkline: number[]; // recent prices, £m, chronological, from our own history
}

export interface TeamRef {
  id: number;
  name: string;
  short: string;
}

export interface DataSnapshot {
  fetchedAt: string;
  currentEventId: number | null;
  nextEventId: number | null;
  nextEventName: string | null;
  nextDeadlineTime: string | null;
  players: Player[];
  teams: TeamRef[];
}

export interface FixtureRun {
  opponentShort: string;
  isHome: boolean;
  difficulty: number; // 1 (easy) - 5 (hard), FPL's own FDR scale
}

export interface HistorySnapshot {
  fetchedAt: string;
  prices: Record<number, number>; // player id -> now_cost (tenths of £m)
}

export interface HistoryFile {
  snapshots: HistorySnapshot[];
}

// Minimal shape of https://fantasy.premierleague.com/api/leagues-classic/{id}/standings/
export interface FplLeagueStandingsEntry {
  entry: number; // manager's FPL team id
  entry_name: string;
  player_name: string;
  rank: number;
  total: number;
}

export interface FplLeagueStandings {
  league: { id: number; name: string };
  standings: {
    has_next: boolean;
    results: FplLeagueStandingsEntry[];
  };
}
