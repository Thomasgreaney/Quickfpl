import type { Metadata } from "next";
import { getLiveSnapshot, getLiveFixtures } from "@/lib/live";
import { readHistory, getPriceSeries } from "@/lib/history";
import { buildFixtureRuns } from "@/lib/fixtures";
import type { PlayerWithSparkline } from "@/lib/fpl-types";
import CollapsibleSection from "@/components/CollapsibleSection";
import RisersFallers from "@/components/RisersFallers";
import TopPlayers from "@/components/TopPlayers";
import PlayerComparison from "@/components/PlayerComparison";
import PlayerLookup from "@/components/PlayerLookup";

export const revalidate = 300;

const TOP_N = 15;

const TITLE = "FPL Player Stats, Price Changes & Ownership | QuickFPL";
const DESCRIPTION =
  "Every FPL player's price, ownership and movement — risers and fallers, the top 15 most-owned, side-by-side comparisons, and full player search.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function InsightsPage() {
  const [snapshot, fixtures, history] = await Promise.all([
    getLiveSnapshot(),
    getLiveFixtures(),
    readHistory(),
  ]);
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
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Insights</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Every FPL player&apos;s price, ownership and movement, tracked over time. No fluff, just
          the numbers.
        </p>
      </header>

      <CollapsibleSection
        id="risers-fallers"
        icon="📊"
        title="Risers & Fallers"
        defaultOpen
        description="Who moved this gameweek, and whether it's worth caring about."
      >
        <RisersFallers players={snapshot.players} />
      </CollapsibleSection>

      <CollapsibleSection
        id="top-15"
        icon="⭐"
        title="Top 15"
        defaultOpen
        description="The 15 most-owned players in the game, with each one's price trend. Tap a column to sort."
      >
        <TopPlayers players={top15} />
      </CollapsibleSection>

      <CollapsibleSection
        id="compare"
        icon="⚖️"
        title="Compare players"
        description="Pick any two and see price, form, points, ownership and fixtures side by side. No verdict — make your own mind up."
      >
        <PlayerComparison players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </CollapsibleSection>

      <CollapsibleSection
        id="find-a-player"
        icon="🔍"
        title="Find a player"
        defaultOpen
        description="Not in the top 15? Look anyone up."
      >
        <PlayerLookup players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </CollapsibleSection>
    </main>
  );
}
