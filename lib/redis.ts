import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, set automatically
// when a Redis database from the Vercel Marketplace is connected to this
// project.
export const redis = Redis.fromEnv();
