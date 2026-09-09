import type { FixtureRun } from "@/lib/fpl-types";

function difficultyClass(d: number): string {
  if (d <= 2) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (d === 3) return "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

/** Next few fixtures as small difficulty-coloured chips (green = easy, red = hard). */
export default function FixtureChips({ fixtures }: { fixtures?: FixtureRun[] }) {
  if (!fixtures || fixtures.length === 0) {
    return <span className="text-xs text-black/30 dark:text-white/30">No fixtures yet</span>;
  }

  return (
    <div className="flex gap-1">
      {fixtures.map((f, i) => (
        <span
          key={i}
          title={`${f.isHome ? "Home" : "Away"} vs ${f.opponentShort} · difficulty ${f.difficulty}/5`}
          className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ${difficultyClass(f.difficulty)}`}
        >
          {f.opponentShort} {f.isHome ? "(H)" : "(A)"}
        </span>
      ))}
    </div>
  );
}
