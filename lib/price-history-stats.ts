export interface PricePoint {
  fetchedAt: string;
  price: number;
}

export interface PriceChangeEvent {
  fetchedAt: string;
  from: number;
  to: number;
  delta: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Every point-to-point price move in the series, in chronological order. */
export function computeChangeEvents(series: PricePoint[]): PriceChangeEvent[] {
  const events: PriceChangeEvent[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    const curr = series[i];
    if (curr.price !== prev.price) {
      events.push({ fetchedAt: curr.fetchedAt, from: prev.price, to: curr.price, delta: round1(curr.price - prev.price) });
    }
  }
  return events;
}

export interface PriceHistorySummary {
  netChange: number;
  rises: number;
  falls: number;
  biggestMove: PriceChangeEvent | null;
}

/** Season-so-far summary stats derived from the full snapshot history. */
export function summarizeHistory(series: PricePoint[]): PriceHistorySummary {
  const events = computeChangeEvents(series);
  const rises = events.filter((e) => e.delta > 0).length;
  const falls = events.filter((e) => e.delta < 0).length;
  const netChange = series.length > 0 ? round1(series[series.length - 1].price - series[0].price) : 0;
  const biggestMove = events.reduce<PriceChangeEvent | null>(
    (biggest, e) => (!biggest || Math.abs(e.delta) > Math.abs(biggest.delta) ? e : biggest),
    null
  );
  return { netChange, rises, falls, biggestMove };
}
