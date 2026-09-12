import type { Metadata } from "next";
import { getLiveSnapshot, getLiveFixtures } from "@/lib/live";
import { buildFixtureRuns } from "@/lib/fixtures";
import CollapsibleSection from "@/components/CollapsibleSection";
import PremiumGate from "@/components/PremiumGate";
import PlannerMembershipBanner from "@/components/PlannerMembershipBanner";
import ChipAnalysis from "@/components/ChipAnalysis";
import TransferShortlist from "@/components/TransferShortlist";
import WeakLinks from "@/components/WeakLinks";
import TransferPlanner from "@/components/TransferPlanner";
import LeagueSimulator from "@/components/LeagueSimulator";
import PricePredictor from "@/components/PricePredictor";

export const revalidate = 300;

const TITLE = "Transfer Planner & Mini-League Simulator | QuickFPL";
const DESCRIPTION =
  "Transfer shortlist, weak links, a 5-gameweek transfer planner, mini-league simulator, price watch and chip-timing analysis.";

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

export default async function PlannerPage() {
  const [snapshot, fixtures] = await Promise.all([getLiveSnapshot(), getLiveFixtures()]);
  const fixturesByTeam = buildFixtureRuns(fixtures, snapshot.teams);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Planner</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Transfers, chips and mini-leagues — worked out from real fixture data, not vibes.
        </p>
      </header>

      <PlannerMembershipBanner />

      <CollapsibleSection
        id="chip-strategy"
        icon="🃏"
        title="Chip strategy"
        description="When to play what you've got left — worked out from real double and blank gameweeks, not vibes."
      >
        <PremiumGate>
          <ChipAnalysis players={snapshot.players} fixtures={fixtures} teams={snapshot.teams} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="transfer-shortlist"
        icon="🔄"
        title="Transfer shortlist"
        description="Who's worth considering this week, and why — ranked by form and how kind their fixtures are, not who's trending on social media."
      >
        <PremiumGate>
          <TransferShortlist players={snapshot.players} fixturesByTeam={fixturesByTeam} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="weak-links"
        icon="⚠️"
        title="Weak links"
        description="Anyone in your saved squad who might be dragging you down — injuries, poor form or a rough run of fixtures."
      >
        <PremiumGate>
          <WeakLinks players={snapshot.players} fixturesByTeam={fixturesByTeam} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="transfer-planner"
        icon="🗓️"
        title="Transfer planner"
        description="Your saved squad's next 5 gameweeks at a glance — who's got a rough patch coming, and any real chip windows worth planning around."
      >
        <PremiumGate>
          <TransferPlanner players={snapshot.players} fixtures={fixtures} teams={snapshot.teams} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="league-simulator"
        icon="🏆"
        title="Mini-league simulator"
        description="Enter your mini-league ID and we'll project the rest of the season — win chance, top-3 chance, average final position. This runs off each manager's season-so-far scoring average and a typical week-to-week spread, not a squad-by-squad simulation of everyone's actual team, so treat it as a rough steer, not a forecast."
      >
        <PremiumGate>
          <LeagueSimulator />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="price-watch"
        icon="👀"
        title="Price watch"
        description="Who's closest to a price change before it happens — estimated from today's transfer momentum. FPL doesn't publish its exact threshold, so treat this as a strong signal, not a guarantee."
      >
        <PremiumGate>
          <PricePredictor players={snapshot.players} />
        </PremiumGate>
      </CollapsibleSection>
    </main>
  );
}
