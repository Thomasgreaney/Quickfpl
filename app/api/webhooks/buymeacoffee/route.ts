import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const DEBUG_KEY = "debug:last-bmc-webhook";

/**
 * DIAGNOSTIC VERSION. We don't yet know the exact shape of Buy Me a
 * Coffee's webhook payload or its signature header, so for now this just
 * safely records whatever arrives (headers + body) so it can be inspected
 * via the /debug route, and always acknowledges with 200 so BMC doesn't
 * treat it as failed. Once we've seen a real payload, this gets replaced
 * with actual signature verification + membership recording.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let body: unknown = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // not JSON, keep the raw text
  }

  await redis.set(DEBUG_KEY, {
    receivedAt: new Date().toISOString(),
    headers,
    body,
  });

  return NextResponse.json({ ok: true });
}
