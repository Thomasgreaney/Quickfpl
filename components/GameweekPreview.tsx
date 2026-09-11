import type { GameweekPreview as GameweekPreviewData } from "@/lib/gameweek-preview";
import PremiumGate from "./PremiumGate";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="mb-3 text-black/80 last:mb-0 dark:text-white/80">
            {p}
          </p>
        ))}
    </>
  );
}

/** The gameweek preview - a short editorial write-up generated ~2 days
 * before each gameweek's deadline (scripts/generate-gameweek-preview.ts).
 * The teaser is free for everyone; the full write-up is a Moyes+ perk. */
export default function GameweekPreview({ preview }: { preview: GameweekPreviewData }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-neutral-900 sm:p-5">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
        {preview.eventName} preview
      </p>
      <Paragraphs text={preview.teaser} />
      <PremiumGate requireTier="moyes" tier="Moyes">
        <div className="mt-1">
          <Paragraphs text={preview.fullWriteup} />
        </div>
      </PremiumGate>
    </div>
  );
}
