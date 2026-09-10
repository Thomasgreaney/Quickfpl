"use client";

import { useState } from "react";
import type { Player } from "@/lib/fpl-types";
import { computeChangeEvents, summarizeHistory, type PricePoint } from "@/lib/price-history-stats";
import PlayerAutocomplete from "./PlayerAutocomplete";
import PlayerPhoto from "./PlayerPhoto";
import PriceHistoryChart from "./PriceHistoryChart";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function fmtDelta(n: number): string {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SummaryRow({ series }: { series: PricePoint[] }) {
  const summary = summarizeHistory(series);
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-black/10 p-2 dark:border-white/15">
        <div
          className={`text-lg font-bold tabular-nums ${
            summary.netChange > 0
              ? "text-green-600 dark:text-green-400"
              : summary.netChange < 0
                ? "text-red-600 dark:text-red-400"
                : ""
          }`}
        >
          {fmtDelta(summary.netChange)}
        </div>
        <div className="text-[11px] text-black/50 dark:text-white/50">net since tracking began</div>
      </div>
      <div className="rounded-lg border border-black/10 p-2 dark:border-white/15">
        <div className="text-lg font-bold tabular-nums">
          {summary.rises} / {summary.falls}
        </div>
        <div className="text-[11px] text-black/50 dark:text-white/50">rises / falls</div>
      </div>
      <div className="rounded-lg border border-black/10 p-2 dark:border-white/15">
        <div className="text-lg font-bold tabular-nums">
          {summary.biggestMove ? fmtDelta(summary.biggestMove.delta) : "—"}
        </div>
        <div className="text-[11px] text-black/50 dark:text-white/50">biggest single move</div>
      </div>
    </div>
  );
}

function ChangeLog({ series }: { series: PricePoint[] }) {
  const events = computeChangeEvents(series).slice().reverse();
  if (events.length === 0) {
    return (
      <p className="mt-3 text-sm text-black/50 dark:text-white/50">
        No price changes recorded yet for this player.
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-black/5 dark:divide-white/10">
      {events.map((e) => (
        <li key={e.fetchedAt} className="flex items-center justify-between py-1.5 text-sm">
          <span className="text-black/60 dark:text-white/60">{fmtDate(e.fetchedAt)}</span>
          <span
            className={
              e.delta > 0
                ? "font-semibold text-green-600 dark:text-green-400"
                : "font-semibold text-red-600 dark:text-red-400"
            }
          >
            {fmtMoney(e.from)} → {fmtMoney(e.to)} ({fmtDelta(e.delta)})
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Fergie-exclusive: pick any player and see their full recorded price
 * history - every snapshot, every change, not just a glance sparkline. */
export default function PriceHistoryExplorer({ players }: { players: Player[] }) {
  const [selected, setSelected] = useState<Player | null>(null);
  const [series, setSeries] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(false);

  function pick(player: Player) {
    setSelected(player);
    setSeries(null);
    setLoading(true);
    fetch(`/api/player-history/${player.id}`)
      .then((res) => res.json())
      .then((data: { series: PricePoint[] }) => setSeries(data.series))
      .catch(() => setSeries([]))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <PlayerAutocomplete
        players={players}
        placeholder="Search a player for their full price history..."
        onSelect={pick}
      />

      {selected && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <PlayerPhoto photoId={selected.photoId} name={selected.name} size={32} />
            <span className="font-semibold">{selected.name}</span>
            <span className="text-sm text-black/50 dark:text-white/50">
              {selected.teamShort} · {fmtMoney(selected.price)}
            </span>
          </div>

          {loading || series === null ? (
            <p className="mt-3 text-sm text-black/50 dark:text-white/50">Loading history…</p>
          ) : (
            <>
              <SummaryRow series={series} />
              <div className="mt-3">
                <PriceHistoryChart series={series} />
              </div>
              <ChangeLog series={series} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
