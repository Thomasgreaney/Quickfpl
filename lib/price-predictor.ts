import type { Player } from "./fpl-types";

// FPL doesn't publish the exact net-transfer threshold that triggers a
// price change, and it scales with how many managers already own a
// player. The best public proxy is net transfers this event relative to
// current ownership - a big swing against a small ownership base is a
// much stronger signal than the same raw number against a huge one.
const MIN_OWNERSHIP_FOR_RATIO = 0.1; // percent, guards against div-by-near-zero for unowned players
const MIN_NET_TRANSFERS = 1000; // raw floor so tiny/noisy counts don't rank purely on ratio
const MAX_CANDIDATES = 8;

export interface PricePrediction {
  player: Player;
  netTransfers: number;
  momentum: number;
}

function withMomentum(players: Player[]): PricePrediction[] {
  return players.map((p) => {
    const netTransfers = p.transfersInEvent - p.transfersOutEvent;
    const momentum = netTransfers / Math.max(p.ownership, MIN_OWNERSHIP_FOR_RATIO);
    return { player: p, netTransfers, momentum };
  });
}

/** Players whose current transfer momentum suggests they're closest to a
 * price rise - ranked by net transfers relative to their existing
 * ownership base, not raw transfer count alone. */
export function predictRisers(players: Player[]): PricePrediction[] {
  return withMomentum(players)
    .filter((e) => e.netTransfers >= MIN_NET_TRANSFERS)
    // Already rose this event - most likely reason for high momentum is
    // the transfers that already triggered it, not a second move coming.
    .filter((e) => e.player.priceChangeEvent <= 0)
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, MAX_CANDIDATES);
}

/** Same idea in reverse - players being sold off fast enough that a
 * price drop looks likely. */
export function predictFallers(players: Player[]): PricePrediction[] {
  return withMomentum(players)
    .filter((e) => e.netTransfers <= -MIN_NET_TRANSFERS)
    .filter((e) => e.player.priceChangeEvent >= 0)
    .sort((a, b) => a.momentum - b.momentum)
    .slice(0, MAX_CANDIDATES);
}
