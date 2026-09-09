import { NextResponse } from "next/server";
import { readHistory, getPriceSeries } from "@/lib/history";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/player-history/[id]">
) {
  const { id } = await ctx.params;
  const playerId = Number(id);
  if (!Number.isFinite(playerId)) {
    return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
  }

  const history = await readHistory();
  const series = getPriceSeries(history, playerId);
  return NextResponse.json({ playerId, series });
}
