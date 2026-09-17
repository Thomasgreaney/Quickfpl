import Link from "next/link";
import { getLiveSnapshot, getEventFixtures } from "@/lib/live";
import { readHistory, diffLatestTwo } from "@/lib/history";
import { readGameweekPreview, isPreviewCurrent } from "@/lib/gameweek-preview";
import { readGameweekWrapup } from "@/lib/gameweek-wrapup";
import type { Player } from "@/lib/fpl-types";
import GameweekPreview from "@/components/GameweekPreview";
import GameweekWrapup from "@/components/GameweekWrapup";
import LocalTime from "@/components/LocalTime";
import DeadlineCountdown from "@/components/DeadlineCountdown";

export const revalidate = 300;

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

const TONE_ICON: Record<"up" | "down" | "neutral", string> = {
  up: "📈",
  down: "📉",
  neutral: "⭐",
};

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
    <Link href="/insights" className="card card-interactive flex items-start gap-3 p-4">
      <span aria-hidden="true" className="icon-badge">
        {TONE_ICON[tone]}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-semibold">{player.name}</span>
        <span className={`mt-0.5 block text-sm font-mono ${toneClass}`}>{detail}</span>
      </span>
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
    <Link href={href} className="card card-interactive flex items-start gap-3 p-4">
      <span aria-hidden="true" className="icon-badge text-xl">
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
  const [snapshot, history, gameweekPreview, gameweekWrapup] = await Promise.all([
    getLiveSnapshot(),
    readHistory(),
    readGameweekPreview(),
    readGameweekWrapup(),
  ]);
  const { moves } = diffLatestTwo(history);

  // The preview always wins while it's still for an upcoming deadline -
  // once that deadline passes it's stale, so fall back to a wrap-up for
  // whichever gameweek is currently in progress. This naturally covers
  // the whole lifecycle: preview until deadline, wrap-up through the
  // gameweek, then back to a fresh preview once one's generated for the
  // next gameweek (its deadline being in the future is what flips it
  // back), without either ever needing to be explicitly cleared.
  const showPreview = isPreviewCurrent(gameweekPreview);
  const wrapupEventId = !showPreview ? snapshot.currentEventId : null;
  const eventFixtures = wrapupEventId ? await getEventFixtures(wrapupEventId) : [];
  const wrapupForThisEvent =
    wrapupEventId && gameweekWrapup?.eventId === wrapupEventId ? gameweekWrapup : null;

  const biggestRiser = [...snapshot.players]
    .filter((p) => p.priceChangeEvent > 0)
    .sort((a, b) => b.priceChangeEvent - a.priceChangeEvent)[0];
  const biggestFaller = [...snapshot.players]
    .filter((p) => p.priceChangeEvent < 0)
    .sort((a, b) => a.priceChangeEvent - b.priceChangeEvent)[0];
  const mostOwned = [...snapshot.players].sort((a, b) => b.ownership - a.ownership)[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="card mb-8 overflow-hidden">
        <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-600 px-5 py-7 text-white sm:px-8 sm:py-9">
          {snapshot.nextDeadlineTime && snapshot.nextEventName && (
            <div className="mb-4">
              <DeadlineCountdown deadline={snapshot.nextDeadlineTime} eventName={snapshot.nextEventName} />
            </div>
          )}
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Quick<span className="text-fuchsia-200">FPL</span>
          </h1>
          <p className="mt-2 max-w-2xl text-white/85">
            Every FPL player&apos;s price, ownership and this season&apos;s movement, tracked over
            time. No fluff, just the numbers.
          </p>
          <p className="mt-3 text-xs text-white/60">
            Data pulled straight from the official FPL API · Updated <LocalTime iso={snapshot.fetchedAt} />
            {moves.length > 0 && ` · ${moves.length} price move${moves.length === 1 ? "" : "s"} since our last check`}
          </p>
        </div>
      </header>

      {showPreview && gameweekPreview ? (
        <section className="mb-8">
          <GameweekPreview preview={gameweekPreview} />
        </section>
      ) : wrapupEventId && eventFixtures.length > 0 ? (
        <section className="mb-8">
          <GameweekWrapup
            eventName={snapshot.currentEventName ?? `Gameweek ${wrapupEventId}`}
            fixtures={eventFixtures}
            teams={snapshot.teams}
            wrapup={wrapupForThisEvent}
          />
        </section>
      ) : null}

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
