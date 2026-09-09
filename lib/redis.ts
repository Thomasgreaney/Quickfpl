import { Redis } from "@upstash/redis";

// This project's connected database is a "Vercel KV" style integration,
// which exposes KV_REST_API_URL / KV_REST_API_TOKEN rather than the
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN names Redis.fromEnv()
// looks for by default - it's the same underlying Upstash REST API either
// way, just a different env var prefix.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
