import type { GameweekPreview as GameweekPreviewData } from "@/lib/gameweek-preview";
import HighlightedParagraphs from "./HighlightedParagraphs";
import PremiumGate from "./PremiumGate";

/** The gameweek preview - a short editorial write-up generated ~2 days
 * before each gameweek's deadline (scripts/generate-gameweek-preview.ts).
 * The teaser is free for everyone; the full write-up is a Moyes+ perk. */
export default function GameweekPreview({ preview }: { preview: GameweekPreviewData }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-neutral-900 sm:p-5">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
        {preview.eventName} preview
      </p>
      <HighlightedParagraphs text={preview.teaser} />
      <PremiumGate requireTier="moyes" tier="Moyes">
        <div className="mt-1">
          <HighlightedParagraphs text={preview.fullWriteup} />
        </div>
      </PremiumGate>
    </div>
  );
}
