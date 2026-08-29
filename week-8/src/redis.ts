import { createClient, type RedisClientType } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis: RedisClientType = createClient({ url: redisUrl });

redis.on("error", (err) => {
  console.error("Redis client error:", err);
});

let connectPromise: Promise<RedisClientType> | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redis.isOpen) return redis;
  if (!connectPromise) {
    connectPromise = redis.connect().then(() => redis);
  }
  return connectPromise;
}

export async function pingRedis(): Promise<boolean> {
  const client = await connectRedis();
  const pong = await client.ping();
  return pong === "PONG";
}
