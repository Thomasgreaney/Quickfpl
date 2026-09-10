import type { Player } from "@/lib/fpl-types";
import { predictRisers, predictFallers, type PricePrediction } from "@/lib/price-predictor";
import PlayerPhoto from "./PlayerPhoto";

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function fmtTransfers(n: number): string {
  const abs = Math.abs(n);
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${abs}`;
}

function reasonFor(direction: "up" | "down"): string {
  return direction === "up"
    ? "Heavy transfer activity relative to how many already own him — often the sign a rise is close."
    : "Being sold off fast relative to his ownership — often the sign a drop is close.";
}

function PredictionCard({ entry, direction }: { entry: PricePrediction; direction: "up" | "down" }) {
  const { player, netTransfers } = entry;
  return (
    <li className="flex gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900">
      <PlayerPhoto photoId={player.photoId} name={player.name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{player.name}</span>
          <span
            className={`whitespace-nowrap font-mono text-sm ${
              direction === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
            title="Net transfers this gameweek"
          >
            {fmtTransfers(netTransfers)}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          {player.teamShort} · {player.position} · {fmtMoney(player.price)} now · {player.ownership.toFixed(1)}%
          owned
        </div>
        <p className="mt-1.5 text-sm text-black/80 dark:text-white/80">{reasonFor(direction)}</p>
      </div>
    </li>
  );
}

/** Estimated from live transfer momentum, not a confirmed move - FPL
 * doesn't publish the exact threshold, and it scales with ownership, so
 * this is a strong signal rather than a guarantee. */
export default function PricePredictor({ players }: { players: Player[] }) {
  const risers = predictRisers(players);
  const fallers = predictFallers(players);

  if (risers.length === 0 && fallers.length === 0) {
    return (
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-4 text-sm text-black/60 dark:border-white/15 dark:bg-white/[.03] dark:text-white/60">
        Nobody&apos;s transfer activity stands out enough to call yet. Check back closer to the deadline.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
          Likely risers
        </h3>
        {risers.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">Nothing standing out right now.</p>
        ) : (
          <ul className="space-y-2">
            {risers.map((entry) => (
              <PredictionCard key={entry.player.id} entry={entry} direction="up" />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
          Likely fallers
        </h3>
        {fallers.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">Nothing standing out right now.</p>
        ) : (
          <ul className="space-y-2">
            {fallers.map((entry) => (
              <PredictionCard key={entry.player.id} entry={entry} direction="down" />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
