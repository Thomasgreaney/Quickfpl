import { NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/live";

export const revalidate = 300;

export async function GET() {
  const snapshot = await getLiveSnapshot();
  return NextResponse.json(snapshot);
}
