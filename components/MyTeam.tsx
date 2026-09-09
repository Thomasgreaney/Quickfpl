"use client";

import { useEffect, useState } from "react";
import type { Player } from "@/lib/fpl-types";
import PlayerAutocomplete from "./PlayerAutocomplete";
import PlayerDetailCard from "./PlayerDetailCard";

const STORAGE_KEY = "quickfpl-my-team";

export default function MyTeam({ players }: { players: Player[] }) {
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage after mount only, so server and first client
  // render match (localStorage doesn't exist on the server). Deferred a
  // microtask so state updates don't happen synchronously inside the effect.
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setTeamIds(JSON.parse(raw));
      } catch {
        // ignore corrupt/unavailable storage
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teamIds));
    } catch {
      // storage unavailable (private browsing etc.) - team just won't persist
    }
  }, [teamIds, loaded]);

  const byId = new Map(players.map((p) => [p.id, p]));
  const team = teamIds.map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));
  const totalValue = team.reduce((sum, p) => sum + p.price, 0);

  function add(player: Player) {
    setTeamIds((prev) => (prev.includes(player.id) ? prev : [...prev, player.id]));
  }

  function remove(id: number) {
    setTeamIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <div>
      <PlayerAutocomplete
        players={players}
        placeholder="Add a player to your team..."
        onSelect={add}
        excludeIds={new Set(teamIds)}
      />

      {team.length === 0 ? (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">
          Empty. Search above and start building your squad — it&apos;s saved on this device.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">
            {team.length} player{team.length === 1 ? "" : "s"} · squad value £{totalValue.toFixed(1)}m
          </p>
          <ul className="mt-2 space-y-2">
            {team.map((p) => (
              <li key={p.id}>
                <PlayerDetailCard player={p} action={{ label: "Remove", onClick: () => remove(p.id) }} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
