"use client";

import { useMemo, useState } from "react";
import type { Player, Position } from "@/lib/fpl-types";

type SortKey =
  | "name"
  | "team"
  | "position"
  | "price"
  | "priceChangeSeason"
  | "ownership"
  | "form"
  | "totalPoints";

const POSITIONS: Position[] = ["GKP", "DEF", "MID", "FWD"];

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function fmtDelta(n: number): string {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

export default function PlayerTable({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [team, setTeam] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("ownership");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const teams = useMemo(
    () => Array.from(new Set(players.map((p) => p.team))).sort(),
    [players]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (position !== "ALL" && p.position !== position) return false;
      if (team !== "ALL" && p.team !== team) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.fullName.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [players, search, position, team]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
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
  }, [filtered, sortKey, sortDir]);

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
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Search a player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900"
        />
        <div className="flex gap-2">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position | "ALL")}
            className="flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900 sm:flex-none"
          >
            <option value="ALL">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900 sm:flex-none"
          >
            <option value="ALL">All teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-2 text-xs text-black/50 dark:text-white/50">
        {sorted.length} player{sorted.length === 1 ? "" : "s"} — tap a column to sort.
      </p>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full min-w-[720px] border-collapse text-sm">
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
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                className="border-t border-black/5 hover:bg-black/[.02] dark:border-white/10 dark:hover:bg-white/[.04]"
              >
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {p.name}
                  {p.status !== "a" && (
                    <span
                      title={p.news || "Availability doubt"}
                      className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500 align-middle"
                    />
                  )}
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
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  {p.totalPoints}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-black/40 dark:text-white/40">
                  Nobody matches that. Try a different search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
