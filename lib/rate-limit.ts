import { redis } from "./redis";

/** Best-effort per-IP daily cap for endpoints that are free to use but
 * still cost real money or hit a third-party API per call (the AI
 * Assistant's Claude calls, the league simulator's FPL API proxy). Not
 * meant to be bulletproof - a determined abuser can rotate IPs - just
 * enough to stop one anonymous visitor or script from running up a large
 * bill or hammering an upstream API. */
export async function checkRateLimit(bucket: string, id: string, maxPerDay: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `rl:${bucket}:${id}:${day}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 24);
  return count <= maxPerDay;
}

/** Best-effort client IP from standard proxy headers (Vercel sets
 * x-forwarded-for). Falls back to a shared "unknown" bucket if neither
 * header is present, which just means those requests share one limit. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
