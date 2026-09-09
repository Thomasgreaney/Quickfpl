import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { redis } from "@/lib/redis";
import { isActiveMembership, memberKey, type BmcWebhookBody, type MembershipRecord } from "@/lib/membership";

function isValidSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(req: Request) {
  const secret = process.env.BMC_WEBHOOK_SECRET;
  if (!secret) {
    console.error("BMC_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature-sha256");

  if (!isValidSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: BmcWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const data = body.data;
  const email = data?.supporter_email;
  if (!email) {
    return NextResponse.json({ ok: true });
  }

  const record: MembershipRecord = {
    active: isActiveMembership(data ?? {}),
    levelName: data?.membership_level_name ?? null,
    levelId: data?.membership_level_id ?? null,
    periodEnd: data?.current_period_end ?? null,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(memberKey(email), record);

  return NextResponse.json({ ok: true });
}
