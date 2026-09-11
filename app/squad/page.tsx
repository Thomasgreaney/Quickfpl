import type { Metadata } from "next";
import { getLiveSnapshot, getLiveFixtures } from "@/lib/live";
import { buildFixtureRuns } from "@/lib/fixtures";
import CollapsibleSection from "@/components/CollapsibleSection";
import SquadBuilder from "@/components/SquadBuilder";
import ChipTracker from "@/components/ChipTracker";
import PremiumGate from "@/components/PremiumGate";
import TransferShortlist from "@/components/TransferShortlist";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Squad — QuickFPL",
  description: "Build your FPL squad, pick a starting XI and bench, and track which chips you've used.",
};

export default async function SquadPage() {
  const [snapshot, fixtures] = await Promise.all([getLiveSnapshot(), getLiveFixtures()]);
  const fixturesByTeam = buildFixtureRuns(fixtures, snapshot.teams);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Squad</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Build your squad and track your chips. Both saved on this device only, both free.
        </p>
      </header>

      <CollapsibleSection
        id="my-team"
        icon="👕"
        title="My team"
        defaultOpen
        description="Build your squad — pick 2 keepers, 5 defenders, 5 midfielders, 3 forwards. Saved on this device only."
      >
        <SquadBuilder players={snapshot.players} fixturesByTeam={fixturesByTeam} />
      </CollapsibleSection>

      <CollapsibleSection
        id="ai-transfer-recommendations"
        icon="🤖"
        title="AI transfer recommendations"
        description="Who's worth bringing in this week, and why — ranked by form and fixtures, with a direct sell/buy call against your saved squad."
      >
        <PremiumGate>
          <TransferShortlist players={snapshot.players} fixturesByTeam={fixturesByTeam} />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="chip-tracker"
        icon="🃏"
        title="Chip tracker"
        description="Tick off which chips you've used — powers the deeper chip-timing analysis on the Planner page."
      >
        <ChipTracker />
      </CollapsibleSection>
    </main>
  );
}
