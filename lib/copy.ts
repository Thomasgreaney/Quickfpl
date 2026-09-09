import type { Player } from "./fpl-types";

/** Short, blunt one-liners for movers. No corporate hedging. */
export function getVerdict(player: Player, direction: "up" | "down"): string {
  const popular = player.ownership >= 15;

  if (direction === "up") {
    if (popular) return "Already widely owned and still climbing. You're probably in.";
    return "Quietly climbing. Get in before it costs you more.";
  }

  if (popular) return "Losing value fast and half the league owns it. Decide now.";
  return "Falling and nobody's rushing to save it.";
}
