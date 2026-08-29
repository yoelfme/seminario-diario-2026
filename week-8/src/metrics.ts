import { Counter, Registry } from "prom-client";

export const metricsRegistry = new Registry();

export const cacheRequests = new Counter({
  name: "cache_requests_total",
  help: "Cache-aside lookups by result and key prefix",
  labelNames: ["result", "key_prefix"] as const,
  registers: [metricsRegistry],
});

export type CacheKeyPrefix =
  | "product"
  | "product_stats"
  | "customer"
  | "top_products";
