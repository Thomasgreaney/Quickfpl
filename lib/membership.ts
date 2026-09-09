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

// Only these tiers unlock gated content - Moyes is support-only.
const GATED_TIERS = new Set(["pep", "fergie"]);

export function tierUnlocksPremium(levelName: string | null | undefined): boolean {
  if (!levelName) return false;
  return GATED_TIERS.has(levelName.trim().toLowerCase());
}

export interface MembershipRecord {
  active: boolean;
  levelName: string | null;
  levelId: number | null;
  periodEnd: number | null;
  updatedAt: string;
}
