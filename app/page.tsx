import { getLiveSnapshot, getLiveFixtures } from "@/lib/live";
import { readHistory, diffLatestTwo, getPriceSeries } from "@/lib/history";
import { buildFixtureRuns } from "@/lib/fixtures";
import type { PlayerWithSparkline } from "@/lib/fpl-types";
import RisersFallers from "@/components/RisersFallers";
import TopPlayers from "@/components/TopPlayers";
import PlayerLookup from "@/components/PlayerLookup";
import SquadBuilder from "@/components/SquadBuilder";
import ChipStrategy from "@/components/ChipStrategy";
import PremiumGate from "@/components/PremiumGate";

export const revalidate = 300;

const TOP_N = 15;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function Home() {
  const [snapshot, fixtures] = await Promise.all([getLiveSnapshot(), getLiveFixtures()]);
  const history = await readHistory();
  const { moves } = diffLatestTwo(history);
  const fixturesByTeam = buildFixtureRuns(fixtures, snapshot.teams);

  const top15: PlayerWithSparkline[] = [...snapshot.players]
    .sort((a, b) => b.ownership - a.ownership)
    .slice(0, TOP_N)
    .map((p) => ({
      ...p,
      sparkline: getPriceSeries(history, p.id).map((point) => point.price),
    }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Quick<span className="text-purple-600">FPL</span>
          </h1>
          <a
            href="https://www.buymeacoffee.com/Quickfpl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#FFDD00] px-3 py-1.5 text-sm font-semibold text-black shadow-sm hover:brightness-95"
          >
            ☕ Buy me a coffee
          </a>
        </div>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Every FPL player&apos;s price, ownership and this season&apos;s movement, tracked over
          time. No fluff, just the numbers.
        </p>
        <p className="mt-3 text-xs text-black/40 dark:text-white/40">
          Data pulled straight from the official FPL API · updated {timeAgo(snapshot.fetchedAt)}
          {moves.length > 0 && ` · ${moves.length} price move${moves.length === 1 ? "" : "s"} since our last check`}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">My team</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          Build your squad — pick 2 keepers, 5 defenders, 5 midfielders, 3 forwards. Saved on this
          device only.
        </p>
        <SquadBuilder players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Chip strategy</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          When to play what you&apos;ve got left — worked out from real double and blank gameweeks,
          not vibes.
        </p>
        <PremiumGate>
          <ChipStrategy players={snapshot.players} fixtures={fixtures} teams={snapshot.teams} />
        </PremiumGate>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Risers &amp; Fallers</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          Who moved this gameweek, and whether it&apos;s worth caring about.
        </p>
        <RisersFallers players={snapshot.players} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Top 15</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          The 15 most-owned players in the game, with each one&apos;s price trend. Tap a column to
          sort.
        </p>
        <TopPlayers players={top15} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Find a player</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          Not in the top 15? Look anyone up.
        </p>
        <PlayerLookup players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </section>

      <footer className="mt-12 border-t border-black/10 py-6 text-xs text-black/40 dark:border-white/10 dark:text-white/40">
        Not affiliated with the Premier League or Fantasy Premier League. Prices update automatically —
        make your own mind up before you take advice from a website.
      </footer>
    </main>
  );
}
