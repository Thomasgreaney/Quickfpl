"use client";

import { useMemo, useState } from "react";
import type { Player } from "@/lib/fpl-types";

export default function PlayerAutocomplete({
  players,
  placeholder = "Search a player...",
  onSelect,
  excludeIds,
}: {
  players: Player[];
  placeholder?: string;
  onSelect: (player: Player) => void;
  excludeIds?: Set<number>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter((p) => !excludeIds?.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [players, query, excludeIds]);

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
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-purple-500 dark:border-white/15 dark:bg-neutral-900"
      />
      {open && query.trim() && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-black/10 bg-white shadow-lg dark:border-white/15 dark:bg-neutral-900">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-black/40 dark:text-white/40">
              No one matches that.
            </li>
          ) : (
            matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => pick(p)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {p.teamShort} · {p.position} · £{p.price.toFixed(1)}m
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
