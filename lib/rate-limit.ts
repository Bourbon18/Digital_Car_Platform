import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let loginRatelimit: Ratelimit | null = null;
let listingRatelimit: Ratelimit | null = null;

function getRedis() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export function getLoginRatelimit() {
  if (!loginRatelimit) {
    const r = getRedis();
    if (!r) return null;
    loginRatelimit = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      analytics: false,
      prefix: "rl:login",
    });
  }
  return loginRatelimit;
}

export function getListingRatelimit() {
  if (!listingRatelimit) {
    const r = getRedis();
    if (!r) return null;
    listingRatelimit = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(5, "24 h"),
      analytics: false,
      prefix: "rl:listing",
    });
  }
  return listingRatelimit;
}

export async function checkLoginRateLimit(ip: string): Promise<{ success: boolean; retryAfter?: number }> {
  const rl = getLoginRatelimit();
  if (!rl) return { success: true };

  const { success, reset } = await rl.limit(ip);
  return { success, retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000) };
}

export async function checkListingRateLimit(userId: string): Promise<{ success: boolean }> {
  const rl = getListingRatelimit();
  if (!rl) return { success: true };

  const { success } = await rl.limit(userId);
  return { success };
}
