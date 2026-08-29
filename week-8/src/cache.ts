import { cacheRequests, type CacheKeyPrefix } from "./metrics.js";
import { connectRedis } from "./redis.js";

export type CacheSource = "redis" | "postgres";

export type CacheAsideResult<T> = {
  data: T;
  source: CacheSource;
};

const defaultTtlSeconds = Number(process.env.CACHE_TTL_SECONDS ?? 60);

export function isCacheEnabledGlobally(): boolean {
  const raw = process.env.CACHE_ENABLED ?? "true";
  return raw !== "0" && raw !== "false" && raw !== "off";
}

export function resolveCacheEnabled(queryCache?: string | undefined): boolean {
  if (queryCache === "off" || queryCache === "false" || queryCache === "0") {
    return false;
  }
  if (queryCache === "on" || queryCache === "true" || queryCache === "1") {
    return true;
  }
  return isCacheEnabledGlobally();
}

export async function cacheAside<T>(options: {
  key: string;
  keyPrefix: CacheKeyPrefix;
  ttlSeconds?: number;
  enabled: boolean;
  load: () => Promise<T>;
}): Promise<CacheAsideResult<T>> {
  const { key, keyPrefix, enabled, load } = options;
  const ttlSeconds = options.ttlSeconds ?? defaultTtlSeconds;

  if (enabled) {
    const client = await connectRedis();
    const cached = await client.get(key);
    if (cached !== null) {
      cacheRequests.inc({ result: "hit", key_prefix: keyPrefix });
      return { data: JSON.parse(cached) as T, source: "redis" };
    }
    cacheRequests.inc({ result: "miss", key_prefix: keyPrefix });
  }

  const data = await load();

  if (enabled) {
    const client = await connectRedis();
    await client.set(key, JSON.stringify(data), { EX: ttlSeconds });
  }

  return { data, source: "postgres" };
}

export async function invalidateKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = await connectRedis();
  await client.del(keys);
}
