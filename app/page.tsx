import { getLiveSnapshot, getLiveFixtures } from "@/lib/live";
import { readHistory, diffLatestTwo, getPriceSeries } from "@/lib/history";
import { readGameweekPreview } from "@/lib/gameweek-preview";
import { buildFixtureRuns } from "@/lib/fixtures";
import type { PlayerWithSparkline } from "@/lib/fpl-types";
import GameweekPreview from "@/components/GameweekPreview";
import CollapsibleSection from "@/components/CollapsibleSection";
import RisersFallers from "@/components/RisersFallers";
import TopPlayers from "@/components/TopPlayers";
import PlayerLookup from "@/components/PlayerLookup";
import SquadBuilder from "@/components/SquadBuilder";
import AiAssistant from "@/components/AiAssistant";
import ChipStrategy from "@/components/ChipStrategy";
import TransferShortlist from "@/components/TransferShortlist";
import WeakLinks from "@/components/WeakLinks";
import TransferPlanner from "@/components/TransferPlanner";
import LeagueSimulator from "@/components/LeagueSimulator";
import PriceHistoryExplorer from "@/components/PriceHistoryExplorer";
import PricePredictor from "@/components/PricePredictor";
import PlayerComparison from "@/components/PlayerComparison";
import PremiumGate from "@/components/PremiumGate";

export const revalidate = 300;

const TOP_N = 15;

const NAV_ITEMS = [
  { href: "#my-team", label: "My team" },
  { href: "#ai-assistant", label: "AI Assistant" },
  { href: "#chip-strategy", label: "Chip strategy" },
  { href: "#transfer-shortlist", label: "Shortlist" },
  { href: "#weak-links", label: "Weak links" },
  { href: "#transfer-planner", label: "Planner" },
  { href: "#league-simulator", label: "Mini-league" },
  { href: "#price-history", label: "Price history" },
  { href: "#price-watch", label: "Price watch" },
  { href: "#risers-fallers", label: "Movers" },
  { href: "#top-15", label: "Top 15" },
  { href: "#compare", label: "Compare" },
  { href: "#find-a-player", label: "Search" },
];

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
  const gameweekPreview = await readGameweekPreview();
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

      <nav
        aria-label="Jump to section"
        className="sticky top-0 z-20 -mx-4 mb-8 flex gap-2 overflow-x-auto border-b border-black/10 bg-white/90 px-4 py-2.5 backdrop-blur [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-white/10 dark:bg-black/85 [&::-webkit-scrollbar]:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-black/5 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {gameweekPreview && (
        <section className="mb-10">
          <GameweekPreview preview={gameweekPreview} />
        </section>
      )}

      <CollapsibleSection
        id="my-team"
        title="My team"
        defaultOpen
        description="Build your squad — pick 2 keepers, 5 defenders, 5 midfielders, 3 forwards. Saved on this device only."
      >
        <SquadBuilder players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </CollapsibleSection>

      <CollapsibleSection
        id="ai-assistant"
        title="AI Assistant"
        description="Ask it anything about your saved squad — grounded in real price, form and fixture data, not a canned answer."
      >
        <PremiumGate requireTier="fergie">
          <AiAssistant />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="chip-strategy"
        title="Chip strategy"
        description="When to play what you've got left — worked out from real double and blank gameweeks, not vibes."
      >
        <PremiumGate>
          <ChipStrategy players={snapshot.players} fixtures={fixtures} teams={snapshot.teams} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="transfer-shortlist"
        title="Transfer shortlist"
        description="Who's worth considering this week, and why — ranked by form and how kind their fixtures are, not who's trending on social media."
      >
        <PremiumGate>
          <TransferShortlist players={snapshot.players} fixturesByTeam={fixturesByTeam} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="weak-links"
        title="Weak links"
        description="Anyone in your saved squad who might be dragging you down — injuries, poor form or a rough run of fixtures."
      >
        <PremiumGate>
          <WeakLinks players={snapshot.players} fixturesByTeam={fixturesByTeam} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="transfer-planner"
        title="Transfer planner"
        description="Your saved squad's next 5 gameweeks at a glance — who's got a rough patch coming, and any real chip windows worth planning around."
      >
        <PremiumGate>
          <TransferPlanner players={snapshot.players} fixtures={fixtures} teams={snapshot.teams} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="league-simulator"
        title="Mini-league simulator"
        description="Enter your mini-league ID and we'll project the rest of the season — win chance, top-3 chance, average final position. This runs off each manager's season-so-far scoring average and a typical week-to-week spread, not a squad-by-squad simulation of everyone's actual team, so treat it as a rough steer, not a forecast."
      >
        <PremiumGate>
          <LeagueSimulator />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="price-history"
        title="Price history"
        description="Every snapshot we've recorded for any player, not just a glance sparkline — the full chart, every price change dated, and the season total."
      >
        <PremiumGate requireTier="fergie">
          <PriceHistoryExplorer players={snapshot.players} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="price-watch"
        title="Price watch"
        description="Who's closest to a price change before it happens — estimated from today's transfer momentum. FPL doesn't publish its exact threshold, so treat this as a strong signal, not a guarantee."
      >
        <PremiumGate>
          <PricePredictor players={snapshot.players} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="risers-fallers"
        title="Risers & Fallers"
        defaultOpen
        description="Who moved this gameweek, and whether it's worth caring about."
      >
        <RisersFallers players={snapshot.players} />
      </CollapsibleSection>

      <CollapsibleSection
        id="top-15"
        title="Top 15"
        defaultOpen
        description="The 15 most-owned players in the game, with each one's price trend. Tap a column to sort."
      >
        <TopPlayers players={top15} />
      </CollapsibleSection>

      <CollapsibleSection
        id="compare"
        title="Compare players"
        description="Pick any two and see price, form, points, ownership and fixtures side by side. No verdict — make your own mind up."
      >
        <PlayerComparison players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </CollapsibleSection>

      <CollapsibleSection
        id="find-a-player"
        title="Find a player"
        defaultOpen
        description="Not in the top 15? Look anyone up."
      >
        <PlayerLookup players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </CollapsibleSection>

      <footer className="mt-12 border-t border-black/10 py-6 text-xs text-black/40 dark:border-white/10 dark:text-white/40">
        Not affiliated with the Premier League or Fantasy Premier League. Prices update automatically —
        make your own mind up before you take advice from a website.
      </footer>
    </main>
  );
}
