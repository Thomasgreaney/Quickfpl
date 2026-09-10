import type { PricePoint } from "@/lib/price-history-stats";

const HEIGHT = 160;
const POINT_SPACING = 14;
const MIN_WIDTH = 320;
const PAD_X = 40;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtMoney(n: number): string {
  return `£${n.toFixed(1)}m`;
}

/** A full-season price chart - every snapshot we've taken, not just a
 * start/end sparkline. Wider, with axis labels and each real price change
 * highlighted so you can see exactly when a move happened. */
export default function PriceHistoryChart({ series }: { series: PricePoint[] }) {
  if (series.length < 2) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        Not enough history yet for this player — check back after a few more snapshots.
      </p>
    );
  }

  const width = Math.max(MIN_WIDTH, series.length * POINT_SPACING);
  const prices = series.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const innerWidth = width - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const baseline = PAD_TOP + innerHeight;

  const coords = series.map((p, i) => ({
    x: PAD_X + (i / (series.length - 1)) * innerWidth,
    y: PAD_TOP + innerHeight - ((p.price - min) / range) * innerHeight,
    point: p,
  }));

  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 bg-white p-2 dark:border-white/15 dark:bg-neutral-900">
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="block">
        <line
          x1={PAD_X}
          y1={baseline}
          x2={width - PAD_X}
          y2={baseline}
          className="stroke-black/10 dark:stroke-white/15"
          strokeWidth={1}
        />
        <polyline
          points={linePoints}
          fill="none"
          className="stroke-purple-600 dark:stroke-purple-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => {
          const prev = i > 0 ? series[i - 1] : null;
          const changed = prev !== null && prev.price !== c.point.price;
          const rose = changed && prev !== null && c.point.price > prev.price;
          const colour = !changed
            ? "fill-black/25 dark:fill-white/40"
            : rose
              ? "fill-green-600 dark:fill-green-400"
              : "fill-red-600 dark:fill-red-400";
          return (
            <circle key={c.point.fetchedAt} cx={c.x} cy={c.y} r={changed ? 3.5 : 2} className={colour}>
              <title>{`${fmtDate(c.point.fetchedAt)} · ${fmtMoney(c.point.price)}`}</title>
            </circle>
          );
        })}
        <text x={PAD_X - 6} y={PAD_TOP + 4} textAnchor="end" className="fill-black/50 text-[10px] dark:fill-white/50">
          {fmtMoney(max)}
        </text>
        <text x={PAD_X - 6} y={baseline} textAnchor="end" className="fill-black/50 text-[10px] dark:fill-white/50">
          {fmtMoney(min)}
        </text>
        <text x={PAD_X} y={HEIGHT - 6} textAnchor="start" className="fill-black/40 text-[10px] dark:fill-white/40">
          {fmtDate(series[0].fetchedAt)}
        </text>
        <text x={width - PAD_X} y={HEIGHT - 6} textAnchor="end" className="fill-black/40 text-[10px] dark:fill-white/40">
          {fmtDate(series[series.length - 1].fetchedAt)}
        </text>
      </svg>
    </div>
  );
}
