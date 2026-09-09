import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const DEBUG_KEY = "debug:last-bmc-webhook";

/**
 * TEMPORARY. Lets us see the last webhook BMC sent while we work out its
 * real payload shape. Delete this route once the real handler is built.
 */
export async function GET() {
  const data = await redis.get(DEBUG_KEY);
  return NextResponse.json(data ?? { message: "No webhook received yet." });
}
