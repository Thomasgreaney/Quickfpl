"use client";

import { useEffect, useMemo, useState } from "react";
import type { FixtureRun, Player, Position } from "@/lib/fpl-types";
import { SQUAD_STORAGE_KEY, SQUAD_UPDATED_EVENT } from "@/lib/squad-storage";
import PlayerPickerModal from "./PlayerPickerModal";
import PlayerPhoto from "./PlayerPhoto";
import FixtureChips from "./FixtureChips";

const BUDGET = 100; // £m, standard FPL squad budget

const FORMATION: { position: Position; count: number }[] = [
  { position: "GKP", count: 2 },
  { position: "DEF", count: 5 },
  { position: "MID", count: 5 },
  { position: "FWD", count: 3 },
];

type Squad = Record<Position, (number | null)[]>;

function emptySquad(): Squad {
  const squad = {} as Squad;
  for (const { position, count } of FORMATION) {
    squad[position] = Array(count).fill(null);
  }
  return squad;
}

type Slot = { position: Position; index: number };

function slotKey(slot: Slot): string {
  return `${slot.position}-${slot.index}`;
}

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

export default function SquadBuilder({
  players,
  fixturesByTeam,
}: {
  players: Player[];
  fixturesByTeam: Record<number, FixtureRun[]>;
}) {
  const [squad, setSquad] = useState<Squad>(emptySquad);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"pitch" | "list">("pitch");
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

  // Load from localStorage after mount only, so server and first client
  // render match (localStorage doesn't exist on the server).
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(SQUAD_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Squad>;
          const merged = emptySquad();
          for (const { position, count } of FORMATION) {
            const saved = parsed[position];
            if (Array.isArray(saved)) {
              for (let i = 0; i < count; i++) merged[position][i] = saved[i] ?? null;
            }
          }
          setSquad(merged);
        }
      } catch {
        // ignore corrupt/unavailable storage
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(squad));
      window.dispatchEvent(new Event(SQUAD_UPDATED_EVENT));
    } catch {
      // storage unavailable (private browsing etc.) - squad just won't persist
    }
  }, [squad, loaded]);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const usedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const { position } of FORMATION) {
      for (const id of squad[position]) if (id !== null) ids.add(id);
    }
    return ids;
  }, [squad]);

  const filledCount = usedIds.size;
  const totalValue = [...usedIds].reduce((sum, id) => sum + (byId.get(id)?.price ?? 0), 0);
  const remainingBudget = Math.max(0, BUDGET - totalValue);

  function fillSlot(slot: Slot, player: Player) {
    setSquad((prev) => {
      const next = { ...prev, [slot.position]: [...prev[slot.position]] };
      next[slot.position][slot.index] = player.id;
      return next;
    });
    setActiveSlot(null);
  }

  function clearSlot(slot: Slot) {
    setSquad((prev) => {
      const next = { ...prev, [slot.position]: [...prev[slot.position]] };
      next[slot.position][slot.index] = null;
      return next;
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-black/10 p-0.5 dark:border-white/15">
          <button
            type="button"
            onClick={() => setView("pitch")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              view === "pitch"
                ? "bg-purple-600 text-white"
                : "text-black/60 hover:bg-black/[.04] dark:text-white/60 dark:hover:bg-white/[.06]"
            }`}
          >
            Pitch view
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              view === "list"
                ? "bg-purple-600 text-white"
                : "text-black/60 hover:bg-black/[.04] dark:text-white/60 dark:hover:bg-white/[.06]"
            }`}
          >
            List
          </button>
        </div>
        <p className="text-xs text-black/50 dark:text-white/50">
          {filledCount}/15 players · {fmtMoney(totalValue)} spent ·{" "}
          <span className={remainingBudget <= 0 ? "font-semibold text-red-600 dark:text-red-400" : ""}>
            {fmtMoney(remainingBudget)} left
          </span>{" "}
          of a {fmtMoney(BUDGET)} budget
        </p>
      </div>

      {view === "pitch" ? (
        <div className="rounded-xl bg-gradient-to-b from-green-600 to-green-700 p-4 sm:p-6">
          <div className="relative flex flex-col gap-4 rounded-lg border-2 border-white/40 py-6">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" />
            {FORMATION.map(({ position, count }) => (
              <div key={position} className="relative z-10 flex justify-center gap-2 px-2 sm:gap-4">
                {Array.from({ length: count }).map((_, index) => {
                  const slot: Slot = { position, index };
                  const playerId = squad[position][index];
                  const player = playerId !== null ? byId.get(playerId) : undefined;
                  return (
                    <SquadSlot
                      key={slotKey(slot)}
                      slot={slot}
                      player={player}
                      onOpen={() => setActiveSlot(slot)}
                      onRemove={() => clearSlot(slot)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {FORMATION.map(({ position, count }) => (
            <div key={position}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
                {position}
              </h3>
              <ul className="space-y-2">
                {Array.from({ length: count }).map((_, index) => {
                  const slot: Slot = { position, index };
                  const playerId = squad[position][index];
                  const player = playerId !== null ? byId.get(playerId) : undefined;
                  return (
                    <li key={slotKey(slot)}>
                      {player ? (
                        <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-2.5 dark:border-white/15 dark:bg-neutral-900">
                          <PlayerPhoto code={player.code} name={player.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate font-medium">{player.name}</span>
                              <span className="whitespace-nowrap text-sm tabular-nums">
                                {fmtMoney(player.price)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-2">
                              <span className="text-xs text-black/50 dark:text-white/50">
                                {player.teamShort}
                              </span>
                              <FixtureChips fixtures={fixturesByTeam[player.teamId]} />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => clearSlot(slot)}
                            className="whitespace-nowrap rounded-md border border-black/10 px-2 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveSlot(slot)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 p-2.5 text-sm text-black/50 hover:bg-black/[.03] dark:border-white/20 dark:text-white/50 dark:hover:bg-white/[.04]"
                        >
                          <span className="text-base leading-none">+</span> Add a {position}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeSlot && (
        <PlayerPickerModal
          players={players}
          positionFilter={activeSlot.position}
          excludeIds={usedIds}
          fixturesByTeam={fixturesByTeam}
          maxPrice={remainingBudget}
          onSelect={(p) => fillSlot(activeSlot, p)}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}

function SquadSlot({
  slot,
  player,
  onOpen,
  onRemove,
}: {
  slot: Slot;
  player: Player | undefined;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="w-16 sm:w-20">
      {player ? (
        <button
          type="button"
          onClick={onRemove}
          title="Remove from squad"
          className="flex w-full flex-col items-center gap-0.5 rounded-md bg-white/95 p-1 text-center shadow hover:bg-white dark:bg-neutral-900/95"
        >
          <PlayerPhoto code={player.code} name={player.name} size={36} />
          <span className="w-full truncate text-[11px] font-semibold text-black dark:text-white">
            {player.name}
          </span>
          <span className="text-[10px] font-medium text-black/60 dark:text-white/60">
            {fmtMoney(player.price)}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full flex-col items-center gap-1 rounded-md border-2 border-dashed border-white/50 bg-white/10 py-3 text-white hover:bg-white/20"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-[10px] font-bold uppercase tracking-wide">{slot.position}</span>
        </button>
      )}
    </div>
  );
}
