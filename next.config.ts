import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage reads data/history.json off disk at request time; make sure
  // it's included in the traced output that ships to Vercel's functions.
  outputFileTracingIncludes: {
    "/": ["./data/history.json"],
  },
};

export default nextConfig;
