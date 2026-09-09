import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage and the player-history API route read data/history.json off
  // disk at request time; make sure it's included in the traced output that
  // ships to Vercel's functions.
  outputFileTracingIncludes: {
    "/": ["./data/history.json"],
    "/api/player-history/[id]": ["./data/history.json"],
  },
};

export default nextConfig;
