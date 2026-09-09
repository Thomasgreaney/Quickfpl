import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { memberKey, tierUnlocksPremium, type MembershipRecord } from "@/lib/membership";

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const record = await redis.get<MembershipRecord>(memberKey(email));
  const unlocked = Boolean(record?.active) && tierUnlocksPremium(record?.levelName);

  return NextResponse.json({ unlocked, levelName: record?.levelName ?? null });
}
