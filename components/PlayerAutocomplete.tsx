"use client";

import { useMemo, useState } from "react";
import type { FixtureRun, Player, Position } from "@/lib/fpl-types";
import FixtureChips from "./FixtureChips";

export default function PlayerAutocomplete({
  players,
  placeholder = "Search a player...",
  onSelect,
  excludeIds,
  positionFilter,
  fixturesByTeam,
  autoFocus,
  maxPrice,
}: {
  players: Player[];
  placeholder?: string;
  onSelect: (player: Player) => void;
  excludeIds?: Set<number>;
  positionFilter?: Position;
  fixturesByTeam?: Record<number, FixtureRun[]>;
  autoFocus?: boolean;
  /** If set, players costing more than this are shown but disabled. */
  maxPrice?: number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => !excludeIds?.has(p.id))
      .filter((p) => !positionFilter || p.position === positionFilter)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [players, query, excludeIds, positionFilter]);

  function pick(player: Player) {
    onSelect(player);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900"
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full min-w-[16rem] overflow-y-auto rounded-md border border-black/10 bg-white shadow-lg dark:border-white/15 dark:bg-neutral-900">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-black/40 dark:text-white/40">
              No one matches that.
            </li>
          ) : (
            matches.map((p) => {
              const affordable = maxPrice === undefined || p.price <= maxPrice + 1e-9;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={!affordable}
                    onMouseDown={() => affordable && pick(p)}
                    className={`flex w-full flex-col gap-1 px-3 py-2 text-left text-sm ${
                      affordable
                        ? "hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="whitespace-nowrap text-xs text-black/50 dark:text-white/50">
                        {p.teamShort} · {p.position} · £{p.price.toFixed(1)}m
                        {!affordable && (
                          <span className="ml-1 font-semibold text-red-600 dark:text-red-400">
                            over budget
                          </span>
                        )}
                      </span>
                    </span>
                    {fixturesByTeam && <FixtureChips fixtures={fixturesByTeam[p.teamId]} />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
