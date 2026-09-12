import type { Metadata } from "next";
import { getLiveSnapshot } from "@/lib/live";
import CollapsibleSection from "@/components/CollapsibleSection";
import PremiumGate from "@/components/PremiumGate";
import AiAssistant from "@/components/AiAssistant";
import PriceHistoryExplorer from "@/components/PriceHistoryExplorer";

export const revalidate = 300;

const TITLE = "AI Assistant — Fantasy Premier League AI Tool | QuickFPL";
const DESCRIPTION =
  "QuickFPL's AI Assistant answers questions about your Fantasy Premier League squad — who to captain, who to transfer, whether your bench is right — using live FPL data. Plus full player price history.";

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

export default async function AssistantPage() {
  const snapshot = await getLiveSnapshot();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">AI Assistant</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          QuickFPL&apos;s AI Assistant answers questions about your Fantasy Premier League squad —
          who to captain, who to transfer, whether your bench is right — using live FPL data, not
          guesswork. Dig into any player&apos;s full price history too.
        </p>
      </header>

      <CollapsibleSection
        id="ai-assistant"
        icon="🤖"
        title="AI Assistant"
        defaultOpen
        description="Ask it anything about your saved squad — grounded in real price, form and fixture data, not a canned answer."
      >
        <PremiumGate requireTier="fergie">
          <AiAssistant />
        </PremiumGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="price-history"
        icon="📈"
        title="Price history"
        defaultOpen
        description="Every snapshot we've recorded for any player, not just a glance sparkline — the full chart, every price change dated, and the season total."
      >
        <PremiumGate requireTier="fergie">
          <PriceHistoryExplorer players={snapshot.players} />
        </PremiumGate>
      </CollapsibleSection>
    </main>
  );
}
