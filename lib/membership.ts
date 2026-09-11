export interface BmcMembershipEventData {
  supporter_email?: string;
  membership_level_name?: string;
  membership_level_id?: number;
  status?: string;
  canceled?: string | boolean;
  paused?: string | boolean;
  current_period_end?: number;
}

export interface BmcWebhookBody {
  type?: string;
  data?: BmcMembershipEventData;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function memberKey(email: string): string {
  return `member:${normalizeEmail(email)}`;
}

/** Works off the current state fields rather than the event type name, so
 * it's correct regardless of whether this came from a started/updated/
 * cancelled/paused event. */
export function isActiveMembership(data: BmcMembershipEventData): boolean {
  const canceled = String(data.canceled) === "true";
  const paused = String(data.paused) === "true";
  return data.status === "active" && !canceled && !paused;
}

// These tiers unlock the main gated tools - Moyes is support-only for
// those. Matched as a substring since BMC's stored level name may be the
// full heading ("Pep - People are noticing you.") rather than just "Pep".
const GATED_TIER_WORDS = ["pep", "fergie"];

export function tierUnlocksPremium(levelName: string | null | undefined): boolean {
  if (!levelName) return false;
  const normalized = levelName.trim().toLowerCase();
  return GATED_TIER_WORDS.some((word) => normalized.includes(word));
}

// Fergie-only features - the top tier's exclusive extras.
const TOP_TIER_WORDS = ["fergie"];

export function tierUnlocksTopTier(levelName: string | null | undefined): boolean {
  if (!levelName) return false;
  const normalized = levelName.trim().toLowerCase();
  return TOP_TIER_WORDS.some((word) => normalized.includes(word));
}

// Any active membership at all, Moyes included - for the handful of
// features (like the full gameweek preview) where even the cheapest tier
// gets the perk, not just Pep/Fergie.
const ANY_TIER_WORDS = ["moyes", "pep", "fergie"];

export function tierUnlocksAnyMembership(levelName: string | null | undefined): boolean {
  if (!levelName) return false;
  const normalized = levelName.trim().toLowerCase();
  return ANY_TIER_WORDS.some((word) => normalized.includes(word));
}

export interface MembershipRecord {
  active: boolean;
  levelName: string | null;
  levelId: number | null;
  periodEnd: number | null;
  updatedAt: string;
}
