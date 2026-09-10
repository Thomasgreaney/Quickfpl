"use client";

import { useState } from "react";
import type { FixtureRun, Player } from "@/lib/fpl-types";
import PlayerAutocomplete from "./PlayerAutocomplete";
import PlayerPhoto from "./PlayerPhoto";
import FixtureChips from "./FixtureChips";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function fmtDelta(n: number): string {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

interface Row {
  label: string;
  a: string;
  b: string;
  // "a" or "b" if one side is clearly ahead on this stat, otherwise undefined
  winner?: "a" | "b";
}

function buildRows(a: Player, b: Player): Row[] {
  const winner = (av: number, bv: number): "a" | "b" | undefined => {
    if (av === bv) return undefined;
    return av > bv ? "a" : "b";
  };

  return [
    { label: "Price", a: fmtMoney(a.price), b: fmtMoney(b.price) },
    {
      label: "Form",
      a: a.form.toFixed(1),
      b: b.form.toFixed(1),
      winner: winner(a.form, b.form),
    },
    {
      label: "Total points",
      a: String(a.totalPoints),
      b: String(b.totalPoints),
      winner: winner(a.totalPoints, b.totalPoints),
    },
    {
      label: "Ownership",
      a: `${a.ownership.toFixed(1)}%`,
      b: `${b.ownership.toFixed(1)}%`,
      winner: winner(a.ownership, b.ownership),
    },
    { label: "Price change (season)", a: fmtDelta(a.priceChangeSeason), b: fmtDelta(b.priceChangeSeason) },
    { label: "Position", a: a.position, b: b.position },
    { label: "Team", a: a.teamShort, b: b.teamShort },
  ];
}

function PlayerHeader({ player }: { player: Player }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <PlayerPhoto photoId={player.photoId} name={player.name} size={48} />
      <span className="font-semibold leading-tight">{player.name}</span>
      {player.status !== "a" && (
        <span
          title={player.news || "Availability doubt"}
          className="rounded bg-red-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-400/15 dark:text-red-400"
        >
          Doubt
        </span>
      )}
    </div>
  );
}

/** Free tool: pick any two players and see price, form, points, ownership
 * and fixtures side by side. No verdict, just the numbers - make your own
 * mind up. */
export default function PlayerComparison({
  players,
  fixturesByTeam,
}: {
  players: Player[];
  fixturesByTeam: Record<number, FixtureRun[]>;
}) {
  const [a, setA] = useState<Player | null>(null);
  const [b, setB] = useState<Player | null>(null);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerAutocomplete players={players} placeholder="First player..." onSelect={setA} />
        <PlayerAutocomplete players={players} placeholder="Second player..." onSelect={setB} />
      </div>

      {a && b && (
        <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
          <div className="grid grid-cols-2 gap-2 border-b border-black/10 bg-black/[.02] p-3 dark:border-white/15 dark:bg-white/[.03]">
            <PlayerHeader player={a} />
            <PlayerHeader player={b} />
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-black/5 p-3 dark:border-white/10">
            <FixtureChips fixtures={fixturesByTeam[a.teamId]} />
            <FixtureChips fixtures={fixturesByTeam[b.teamId]} />
          </div>

          {buildRows(a, b).map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-black/5 px-3 py-2 text-sm last:border-b-0 dark:border-white/10"
            >
              <span
                className={`text-right tabular-nums ${
                  row.winner === "a" ? "font-bold text-green-700 dark:text-green-400" : ""
                }`}
              >
                {row.a}
              </span>
              <span className="whitespace-nowrap text-center text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
                {row.label}
              </span>
              <span
                className={`text-left tabular-nums ${
                  row.winner === "b" ? "font-bold text-green-700 dark:text-green-400" : ""
                }`}
              >
                {row.b}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
