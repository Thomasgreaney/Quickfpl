import { getLiveSnapshot } from "@/lib/live";
import { readHistory, diffLatestTwo } from "@/lib/history";
import PlayerTable from "@/components/PlayerTable";
import RisersFallers from "@/components/RisersFallers";

export const revalidate = 300;

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
  const snapshot = await getLiveSnapshot();
  const history = await readHistory();
  const { moves } = diffLatestTwo(history);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Quick<span className="text-purple-600">FPL</span>
        </h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Every FPL player&apos;s price, ownership and this season&apos;s movement in one table.
          No fluff, just the numbers — sort it, filter it, find your next transfer.
        </p>
        <p className="mt-3 text-xs text-black/40 dark:text-white/40">
          Data pulled straight from the official FPL API · updated {timeAgo(snapshot.fetchedAt)}
          {moves.length > 0 && ` · ${moves.length} price move${moves.length === 1 ? "" : "s"} since our last check`}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Risers &amp; Fallers</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          Who moved this gameweek, and whether it&apos;s worth caring about.
        </p>
        <RisersFallers players={snapshot.players} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">All players</h2>
        <PlayerTable players={snapshot.players} />
      </section>

      <footer className="mt-12 border-t border-black/10 py-6 text-xs text-black/40 dark:border-white/10 dark:text-white/40">
        Not affiliated with the Premier League or Fantasy Premier League. Prices update automatically —
        make your own mind up before you take advice from a website.
      </footer>
    </main>
  );
}
