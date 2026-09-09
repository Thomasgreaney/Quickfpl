"use client";

import { useEffect, useState } from "react";
import type { FixtureRun, Player } from "@/lib/fpl-types";
import Sparkline from "./Sparkline";
import PlayerPhoto from "./PlayerPhoto";
import FixtureChips from "./FixtureChips";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function fmtDelta(n: number): string {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

export default function PlayerDetailCard({
  player,
  action,
  fixtures,
}: {
  player: Player;
  action?: { label: string; onClick: () => void };
  fixtures?: FixtureRun[];
}) {
  const [series, setSeries] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/player-history/${player.id}`)
      .then((res) => res.json())
      .then((data: { series: { price: number }[] }) => {
        if (!cancelled) setSeries(data.series.map((p) => p.price));
      })
      .catch(() => {
        if (!cancelled) setSeries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [player.id]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerPhoto photoId={player.photoId} name={player.name} size={40} />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold">{player.name}</span>
            {player.status !== "a" && (
              <span
                title={player.news || "Availability doubt"}
                className="inline-block h-2 w-2 rounded-full bg-red-500"
              />
            )}
          </div>
          <div className="text-xs text-black/50 dark:text-white/50">
            {player.teamShort} · {player.position} · {fmtMoney(player.price)} ·{" "}
            <span
              className={
                player.priceChangeSeason > 0
                  ? "text-green-600 dark:text-green-400"
                  : player.priceChangeSeason < 0
                    ? "text-red-600 dark:text-red-400"
                    : ""
              }
            >
              {fmtDelta(player.priceChangeSeason)} this season
            </span>{" "}
            · {player.ownership.toFixed(1)}% owned
          </div>
          {fixtures && (
            <div className="mt-1">
              <FixtureChips fixtures={fixtures} />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {series === null ? (
          <span className="text-xs text-black/30 dark:text-white/30">…</span>
        ) : (
          <Sparkline values={series} />
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="whitespace-nowrap rounded-md border border-black/10 px-2 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
