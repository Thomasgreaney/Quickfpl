import type { Metadata } from "next";
import { getLiveSnapshot } from "@/lib/live";
import CollapsibleSection from "@/components/CollapsibleSection";
import PremiumGate from "@/components/PremiumGate";
import AiAssistant from "@/components/AiAssistant";
import PriceHistoryExplorer from "@/components/PriceHistoryExplorer";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Assistant — QuickFPL",
  description: "Ask the AI Assistant anything about your saved squad, and explore full player price history.",
};

export default async function AssistantPage() {
  const snapshot = await getLiveSnapshot();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">AI Assistant</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Ask it anything about your saved squad, and dig into any player&apos;s full price history.
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
