"use client";

import { useState } from "react";
import type { Player } from "@/lib/fpl-types";
import PlayerAutocomplete from "./PlayerAutocomplete";
import PlayerDetailCard from "./PlayerDetailCard";

export default function PlayerLookup({ players }: { players: Player[] }) {
  const [selected, setSelected] = useState<Player[]>([]);

  function add(player: Player) {
    setSelected((prev) => (prev.some((p) => p.id === player.id) ? prev : [player, ...prev]));
  }

  function remove(id: number) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <PlayerAutocomplete
        players={players}
        placeholder="Not in the top 15? Search any player..."
        onSelect={add}
      />
      {selected.length > 0 && (
        <ul className="mt-3 space-y-2">
          {selected.map((p) => (
            <li key={p.id}>
              <PlayerDetailCard player={p} action={{ label: "Dismiss", onClick: () => remove(p.id) }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
