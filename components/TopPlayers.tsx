"use client";

import { useMemo, useState } from "react";
import type { PlayerWithSparkline } from "@/lib/fpl-types";
import Sparkline from "./Sparkline";
import PlayerPhoto from "./PlayerPhoto";

type SortKey =
  | "name"
  | "team"
  | "position"
  | "price"
  | "priceChangeSeason"
  | "ownership"
  | "form"
  | "totalPoints";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function fmtDelta(n: number): string {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

export default function TopPlayers({ players }: { players: PlayerWithSparkline[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ownership");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...players];
    copy.sort((a, b) => {
      let av: string | number = a[sortKey];
      let bv: string | number = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [players, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "name", label: "Player" },
    { key: "team", label: "Team" },
    { key: "position", label: "Pos" },
    { key: "price", label: "Price", align: "right" },
    { key: "priceChangeSeason", label: "Season Δ", align: "right" },
    { key: "ownership", label: "Owned %", align: "right" },
    { key: "form", label: "Form", align: "right" },
    { key: "totalPoints", label: "Points", align: "right" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="bg-black/[.03] text-left dark:bg-white/[.06]">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-semibold ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.label}
                {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">History</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.id}
              className="border-t border-black/5 hover:bg-black/[.02] dark:border-white/10 dark:hover:bg-white/[.04]"
            >
              <td className="whitespace-nowrap px-3 py-2 font-medium">
                <span className="flex items-center gap-2">
                  <PlayerPhoto photoId={p.photoId} name={p.name} size={28} />
                  {p.name}
                  {p.status !== "a" && (
                    <span
                      title={p.news || "Availability doubt"}
                      className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-red-500"
                    />
                  )}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-black/60 dark:text-white/60">
                {p.teamShort}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-black/60 dark:text-white/60">
                {p.position}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                {fmtMoney(p.price)}
              </td>
              <td
                className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${
                  p.priceChangeSeason > 0
                    ? "text-green-600 dark:text-green-400"
                    : p.priceChangeSeason < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-black/40 dark:text-white/40"
                }`}
              >
                {fmtDelta(p.priceChangeSeason)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                {p.ownership.toFixed(1)}%
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                {p.form.toFixed(1)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{p.totalPoints}</td>
              <td className="whitespace-nowrap px-3 py-2">
                <Sparkline values={p.sparkline} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
