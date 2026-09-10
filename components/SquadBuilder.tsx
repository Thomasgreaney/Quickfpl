"use client";

import { useEffect, useMemo, useState } from "react";
import type { FixtureRun, Player, Position } from "@/lib/fpl-types";
import { SQUAD_STORAGE_KEY, SQUAD_UPDATED_EVENT } from "@/lib/squad-storage";
import { suggestBench } from "@/lib/bench";
import PlayerPickerModal from "./PlayerPickerModal";
import PlayerPhoto from "./PlayerPhoto";
import FixtureChips from "./FixtureChips";

const BUDGET = 100; // £m, standard FPL squad budget
const SQUAD_SIZE = 15;
const BENCH_SIZE = 4;

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
  const [bench, setBench] = useState<Set<number>>(new Set());
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
          const parsed = JSON.parse(raw) as Partial<Squad> & { bench?: number[] };
          const merged = emptySquad();
          for (const { position, count } of FORMATION) {
            const saved = parsed[position];
            if (Array.isArray(saved)) {
              for (let i = 0; i < count; i++) merged[position][i] = saved[i] ?? null;
            }
          }
          setSquad(merged);
          if (Array.isArray(parsed.bench)) {
            setBench(new Set(parsed.bench.filter((id): id is number => typeof id === "number")));
          }
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
      window.localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify({ ...squad, bench: [...bench] }));
      window.dispatchEvent(new Event(SQUAD_UPDATED_EVENT));
    } catch {
      // storage unavailable (private browsing etc.) - squad just won't persist
    }
  }, [squad, bench, loaded]);

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
    const removedId = squad[slot.position][slot.index];
    setSquad((prev) => {
      const next = { ...prev, [slot.position]: [...prev[slot.position]] };
      next[slot.position][slot.index] = null;
      return next;
    });
    if (removedId !== null) {
      setBench((prev) => {
        if (!prev.has(removedId)) return prev;
        const next = new Set(prev);
        next.delete(removedId);
        return next;
      });
    }
  }

  function toggleBench(playerId: number, position: Position) {
    setBench((prev) => {
      if (prev.has(playerId)) {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      }
      if (prev.size >= BENCH_SIZE) return prev;
      if (position === "GKP") {
        // Never let both keepers be benched at once - there'd be no one
        // left in goal.
        const otherGkpId = squad.GKP.find((id) => id !== null && id !== playerId);
        if (otherGkpId !== null && otherGkpId !== undefined && prev.has(otherGkpId)) return prev;
      }
      const next = new Set(prev);
      next.add(playerId);
      return next;
    });
  }

  function autoPickBench() {
    const squadPlayers = [...usedIds].map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));
    const suggested = suggestBench(squadPlayers);
    if (suggested.length === BENCH_SIZE) setBench(new Set(suggested));
  }

  function slotsForPosition(position: Position): { slot: Slot; player: Player }[] {
    return squad[position]
      .map((id, index): { slot: Slot; player: Player | undefined } => ({
        slot: { position, index },
        player: id !== null ? byId.get(id) : undefined,
      }))
      .filter((x): x is { slot: Slot; player: Player } => Boolean(x.player));
  }

  const isFull = filledCount === SQUAD_SIZE;

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
          {filledCount}/{SQUAD_SIZE} players · {fmtMoney(totalValue)} spent ·{" "}
          <span className={remainingBudget <= 0 ? "font-semibold text-red-600 dark:text-red-400" : ""}>
            {fmtMoney(remainingBudget)} left
          </span>{" "}
          of a {fmtMoney(BUDGET)} budget
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 bg-black/[.02] px-3 py-2 dark:border-white/15 dark:bg-white/[.03]">
        <p className="text-xs text-black/60 dark:text-white/60">
          {bench.size}/{BENCH_SIZE} on the bench
          {filledCount === SQUAD_SIZE ? "" : " — fill your squad first"}. Tap the bench icon on a player
          to sub them, or let us pick.
        </p>
        <button
          type="button"
          onClick={autoPickBench}
          disabled={filledCount !== SQUAD_SIZE}
          className="whitespace-nowrap rounded-md border border-purple-600 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:border-black/10 disabled:text-black/30 dark:text-purple-400 dark:hover:bg-purple-950/40 dark:disabled:border-white/10 dark:disabled:text-white/20"
        >
          Auto-pick bench
        </button>
      </div>

      {view === "pitch" ? (
        isFull ? (
          <div className="rounded-xl bg-gradient-to-b from-green-600 to-green-700 p-4 sm:p-6">
            <div className="relative flex flex-col gap-4 rounded-lg border-2 border-white/40 py-6">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" />
              {FORMATION.map(({ position }) => {
                const starting = slotsForPosition(position).filter(({ player }) => !bench.has(player.id));
                if (starting.length === 0) return null;
                return (
                  <div key={position} className="relative z-10 flex justify-center gap-2 px-2 sm:gap-4">
                    {starting.map(({ slot, player }) => (
                      <SquadSlot
                        key={slotKey(slot)}
                        slot={slot}
                        player={player}
                        benched={false}
                        onOpen={() => setActiveSlot(slot)}
                        onRemove={() => clearSlot(slot)}
                        onToggleBench={() => toggleBench(player.id, position)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg bg-black/25 p-3">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/70">
                Substitutes {bench.size < BENCH_SIZE && `(${bench.size}/${BENCH_SIZE})`}
              </p>
              {bench.size === 0 ? (
                <p className="text-center text-xs text-white/60">
                  Nobody&apos;s benched yet — tap the badge on a player above, or use Auto-pick bench.
                </p>
              ) : (
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                  {FORMATION.flatMap(({ position }) =>
                    slotsForPosition(position).filter(({ player }) => bench.has(player.id))
                  ).map(({ slot, player }) => (
                    <SquadSlot
                      key={slotKey(slot)}
                      slot={slot}
                      player={player}
                      benched={true}
                      onOpen={() => setActiveSlot(slot)}
                      onRemove={() => clearSlot(slot)}
                      onToggleBench={() => toggleBench(player.id, slot.position)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
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
                        benched={false}
                        onOpen={() => setActiveSlot(slot)}
                        onRemove={() => clearSlot(slot)}
                        onToggleBench={() => playerId !== null && toggleBench(playerId, position)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )
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
                  const isBenched = playerId !== null && bench.has(playerId);
                  return (
                    <li key={slotKey(slot)}>
                      {player ? (
                        <div
                          className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                            isBenched
                              ? "border-black/10 bg-black/[.03] dark:border-white/10 dark:bg-white/[.03]"
                              : "border-black/10 bg-white dark:border-white/15 dark:bg-neutral-900"
                          }`}
                        >
                          <PlayerPhoto photoId={player.photoId} name={player.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`truncate font-medium ${isBenched ? "text-black/50 dark:text-white/50" : ""}`}
                              >
                                {player.name}
                                {isBenched && (
                                  <span className="ml-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/50 dark:bg-white/10 dark:text-white/50">
                                    Sub
                                  </span>
                                )}
                              </span>
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
                            onClick={() => toggleBench(player.id, position)}
                            className="whitespace-nowrap rounded-md border border-black/10 px-2 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
                          >
                            {isBenched ? "Start" : "Bench"}
                          </button>
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
  benched,
  onOpen,
  onRemove,
  onToggleBench,
}: {
  slot: Slot;
  player: Player | undefined;
  benched: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onToggleBench: () => void;
}) {
  return (
    <div className="relative w-16 sm:w-20">
      {player ? (
        <>
          <button
            type="button"
            onClick={onRemove}
            title="Remove from squad"
            className={`flex w-full flex-col items-center gap-0.5 rounded-md p-1 text-center shadow hover:opacity-90 ${
              benched ? "bg-white/60 dark:bg-neutral-900/60" : "bg-white/95 dark:bg-neutral-900/95"
            }`}
          >
            <PlayerPhoto photoId={player.photoId} name={player.name} size={36} />
            <span
              className={`w-full truncate text-[11px] font-semibold ${
                benched ? "text-black/50 dark:text-white/50" : "text-black dark:text-white"
              }`}
            >
              {player.name}
            </span>
            <span className="text-[10px] font-medium text-black/60 dark:text-white/60">
              {fmtMoney(player.price)}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBench();
            }}
            title={benched ? "Move to starting XI" : "Move to bench"}
            className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow ${
              benched
                ? "bg-amber-500 text-white"
                : "bg-white text-black/40 hover:text-black/70 dark:bg-neutral-800 dark:text-white/40 dark:hover:text-white/70"
            }`}
          >
            {benched ? "S" : "B"}
          </button>
        </>
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
