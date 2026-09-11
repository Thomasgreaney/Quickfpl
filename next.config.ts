import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage and the player-history API route read data/history.json off
  // disk at request time; make sure it's included in the traced output that
  // ships to Vercel's functions. Same for the gameweek preview.
  outputFileTracingIncludes: {
    "/": ["./data/history.json", "./data/gameweek-preview.json"],
    "/api/player-history/[id]": ["./data/history.json"],
  },
};

export default nextConfig;
