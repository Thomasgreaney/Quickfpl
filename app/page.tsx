import Link from "next/link";
import { getLiveSnapshot } from "@/lib/live";
import { readHistory, diffLatestTwo } from "@/lib/history";
import { readGameweekPreview } from "@/lib/gameweek-preview";
import type { Player } from "@/lib/fpl-types";
import GameweekPreview from "@/components/GameweekPreview";
import LocalTime from "@/components/LocalTime";
import DeadlineCountdown from "@/components/DeadlineCountdown";

export const revalidate = 300;

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

function StatCard({
  label,
  player,
  detail,
  tone,
}: {
  label: string;
  player: Player;
  detail: string;
  tone: "up" | "down" | "neutral";
}) {
  const toneClass =
    tone === "up"
      ? "text-green-600 dark:text-green-400"
      : tone === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-purple-600 dark:text-purple-400";
  return (
    <Link
      href="/insights"
      className="block rounded-lg border border-black/10 bg-white p-3 transition hover:border-purple-600/40 dark:border-white/15 dark:bg-neutral-900"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-black/50 dark:text-white/50">{label}</p>
      <p className="mt-1 font-semibold">{player.name}</p>
      <p className={`mt-0.5 text-sm font-mono ${toneClass}`}>{detail}</p>
    </Link>
  );
}

function QuickLinkCard({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg border border-black/10 bg-white p-3 transition hover:border-purple-600/40 dark:border-white/15 dark:bg-neutral-900"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {icon}
      </span>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-black/60 dark:text-white/60">{description}</span>
      </span>
    </Link>
  );
}

export default async function Home() {
  const [snapshot, history, gameweekPreview] = await Promise.all([
    getLiveSnapshot(),
    readHistory(),
    readGameweekPreview(),
  ]);
  const { moves } = diffLatestTwo(history);

  const biggestRiser = [...snapshot.players]
    .filter((p) => p.priceChangeEvent > 0)
    .sort((a, b) => b.priceChangeEvent - a.priceChangeEvent)[0];
  const biggestFaller = [...snapshot.players]
    .filter((p) => p.priceChangeEvent < 0)
    .sort((a, b) => a.priceChangeEvent - b.priceChangeEvent)[0];
  const mostOwned = [...snapshot.players].sort((a, b) => b.ownership - a.ownership)[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {snapshot.nextDeadlineTime && snapshot.nextEventName && (
        <div className="mb-4">
          <DeadlineCountdown deadline={snapshot.nextDeadlineTime} eventName={snapshot.nextEventName} />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Quick<span className="text-purple-600">FPL</span>
        </h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Every FPL player&apos;s price, ownership and this season&apos;s movement, tracked over
          time. No fluff, just the numbers.
        </p>
        <p className="mt-3 text-xs text-black/40 dark:text-white/40">
          Data pulled straight from the official FPL API · Updated <LocalTime iso={snapshot.fetchedAt} />
          {moves.length > 0 && ` · ${moves.length} price move${moves.length === 1 ? "" : "s"} since our last check`}
        </p>
      </header>

      {gameweekPreview && (
        <section className="mb-8">
          <GameweekPreview preview={gameweekPreview} />
        </section>
      )}

      {(biggestRiser || biggestFaller || mostOwned) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
            Today at a glance
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {biggestRiser && (
              <StatCard
                label="Biggest riser"
                player={biggestRiser}
                detail={`${fmtMoney(biggestRiser.price)} · +${fmtMoney(biggestRiser.priceChangeEvent)}`}
                tone="up"
              />
            )}
            {biggestFaller && (
              <StatCard
                label="Biggest faller"
                player={biggestFaller}
                detail={`${fmtMoney(biggestFaller.price)} · −${fmtMoney(Math.abs(biggestFaller.priceChangeEvent))}`}
                tone="down"
              />
            )}
            {mostOwned && (
              <StatCard
                label="Most owned"
                player={mostOwned}
                detail={`${mostOwned.ownership.toFixed(1)}% owned`}
                tone="neutral"
              />
            )}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLinkCard href="/squad" icon="👕" label="Squad" description="Build your team, pick a bench" />
          <QuickLinkCard href="/insights" icon="📊" label="Insights" description="Movers, top 15, compare players" />
          <QuickLinkCard href="/planner" icon="🗓️" label="Planner" description="Transfers, chips, mini-league" />
          <QuickLinkCard href="/assistant" icon="🤖" label="AI Assistant" description="Ask about your squad" />
        </div>
      </section>

      <footer className="mt-4 border-t border-black/10 py-6 text-xs text-black/40 dark:border-white/10 dark:text-white/40">
        Not affiliated with the Premier League or Fantasy Premier League. Prices update automatically —
        make your own mind up before you take advice from a website.
      </footer>
    </main>
  );
}
