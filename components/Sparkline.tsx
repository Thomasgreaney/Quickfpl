const WIDTH = 84;
const HEIGHT = 26;
const PAD = 3;

/** Minimal inline SVG sparkline. No charting library needed for a single line. */
export default function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <span className="text-xs text-black/30 dark:text-white/30" title="Not enough history yet">
        —
      </span>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2);
    const y = HEIGHT - PAD - ((v - min) / range) * (HEIGHT - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trend = values[values.length - 1] - values[0];
  const color =
    trend > 0
      ? "stroke-green-600 dark:stroke-green-400"
      : trend < 0
        ? "stroke-red-600 dark:stroke-red-400"
        : "stroke-black/40 dark:stroke-white/40";

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="inline-block align-middle"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        className={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
