import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { memberKey, type MembershipRecord } from "@/lib/membership";

/** Everything on the site is free now - this only answers "is this email
 * currently paying to go ad-free", for AdSlot and the /pricing unlock form. */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const record = await redis.get<MembershipRecord>(memberKey(email));
  const adFree = Boolean(record?.active);

  return NextResponse.json({ adFree, levelName: record?.levelName ?? null });
}
