import type { Player } from "@/lib/fpl-types";
import { getVerdict } from "@/lib/copy";
import PlayerPhoto from "./PlayerPhoto";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function MoverCard({ player, direction }: { player: Player; direction: "up" | "down" }) {
  const delta = direction === "up" ? player.priceChangeEvent : -player.priceChangeEvent;
  return (
    <li className="flex gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900">
      <PlayerPhoto code={player.code} name={player.name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{player.name}</span>
          <span
            className={`whitespace-nowrap font-mono text-sm ${
              direction === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {direction === "up" ? "+" : "−"}
            {fmtMoney(Math.abs(delta))}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          {player.teamShort} · {player.position} · {fmtMoney(player.price)} now · {player.ownership.toFixed(1)}% owned
        </div>
        <p className="mt-1.5 text-sm text-black/80 dark:text-white/80">
          {getVerdict(player, direction)}
        </p>
      </div>
    </li>
  );
}

export default function RisersFallers({ players }: { players: Player[] }) {
  const risers = players
    .filter((p) => p.priceChangeEvent > 0)
    .sort((a, b) => b.priceChangeEvent - a.priceChangeEvent)
    .slice(0, 5);

  const fallers = players
    .filter((p) => p.priceChangeEvent < 0)
    .sort((a, b) => a.priceChangeEvent - b.priceChangeEvent)
    .slice(0, 5);

  if (risers.length === 0 && fallers.length === 0) {
    return (
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-4 text-sm text-black/60 dark:border-white/15 dark:bg-white/[.03] dark:text-white/60">
        Nobody&apos;s price has moved this gameweek yet. Check back later.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
          Risers
        </h3>
        {risers.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">Nobody&apos;s up right now.</p>
        ) : (
          <ul className="space-y-2">
            {risers.map((p) => (
              <MoverCard key={p.id} player={p} direction="up" />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
          Fallers
        </h3>
        {fallers.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">Nobody&apos;s down right now.</p>
        ) : (
          <ul className="space-y-2">
            {fallers.map((p) => (
              <MoverCard key={p.id} player={p} direction="down" />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
