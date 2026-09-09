"use client";

import { useMemo, useState } from "react";
import type { FixtureRun, Player, Position } from "@/lib/fpl-types";
import FixtureChips from "./FixtureChips";
import PlayerPhoto from "./PlayerPhoto";

export default function PlayerPickerModal({
  players,
  positionFilter,
  excludeIds,
  fixturesByTeam,
  maxPrice,
  onSelect,
  onClose,
}: {
  players: Player[];
  positionFilter: Position;
  excludeIds: Set<number>;
  fixturesByTeam: Record<number, FixtureRun[]>;
  maxPrice: number;
  onSelect: (p: Player) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => p.position === positionFilter)
      .filter((p) => !excludeIds.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q))
      .sort((a, b) => b.ownership - a.ownership)
      .slice(0, 50);
  }, [players, query, positionFilter, excludeIds]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl dark:bg-neutral-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 p-4 dark:border-white/10">
          <h3 className="font-semibold">Add a {positionFilter}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-black/50 hover:bg-black/[.06] dark:text-white/50 dark:hover:bg-white/[.08]"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${positionFilter}s...`}
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-950"
          />
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-3">
          {matches.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-black/40 dark:text-white/40">
              No one matches that.
            </li>
          ) : (
            matches.map((p) => {
              const affordable = p.price <= maxPrice + 1e-9;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => affordable && onSelect(p)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left ${
                      affordable
                        ? "hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <PlayerPhoto code={p.code} name={p.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="whitespace-nowrap text-xs text-black/50 dark:text-white/50">
                          {p.teamShort} · £{p.price.toFixed(1)}m
                          {!affordable && (
                            <span className="ml-1 font-semibold text-red-600 dark:text-red-400">
                              over budget
                            </span>
                          )}
                        </span>
                      </div>
                      <FixtureChips fixtures={fixturesByTeam[p.teamId]} />
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
