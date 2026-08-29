import { serve } from "@hono/node-server";
import { prometheus } from "@hono/prometheus";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cacheAside, invalidateKeys, resolveCacheEnabled } from "./cache.js";
import { pingDb, sql } from "./db.js";
import { metricsRegistry } from "./metrics.js";
import { connectRedis, pingRedis } from "./redis.js";
import {
  createOrder,
  getCustomerWithOrders,
  getProductById,
  getProductStats,
  getTopProducts,
} from "./store.js";

const app = new Hono();
const port = Number(process.env.PORT ?? 8080);

const { printMetrics, registerMetrics } = prometheus({
  registry: metricsRegistry,
  collectDefaultMetrics: true,
});

app.use("*", registerMetrics);
app.use("*", logger());
app.get("/metrics", printMetrics);

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

app.get("/health", async (c) => {
  const [dbOk, redisOk] = await Promise.all([
    pingDb().then(() => true).catch(() => false),
    pingRedis().then(() => true).catch(() => false),
  ]);
  const ok = dbOk && redisOk;
  return c.json(
    {
      status: ok ? "ok" : "degraded",
      postgres: dbOk,
      redis: redisOk,
      cache_enabled: resolveCacheEnabled(),
    },
    ok ? 200 : 503,
  );
});

app.get("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid product id" }, 400);
  }

  const cacheEnabled = resolveCacheEnabled(c.req.query("cache"));
  const started = performance.now();
  const result = await cacheAside({
    key: `product:${id}`,
    keyPrefix: "product",
    enabled: cacheEnabled,
    load: () => getProductById(id),
  });
  const durationMs = Number((performance.now() - started).toFixed(2));

  if (!result.data) {
    return c.json({ error: "Product not found", durationMs, source: result.source }, 404);
  }

  return c.json({
    data: result.data,
    source: result.source,
    durationMs,
    cacheEnabled,
  });
});

app.get("/products/:id/stats", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid product id" }, 400);
  }

  const product = await getProductById(id);
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }

  const cacheEnabled = resolveCacheEnabled(c.req.query("cache"));
  const started = performance.now();
  const result = await cacheAside({
    key: `product_stats:${id}`,
    keyPrefix: "product_stats",
    enabled: cacheEnabled,
    load: () => getProductStats(id),
  });
  const durationMs = Number((performance.now() - started).toFixed(2));

  return c.json({
    data: { product, stats: result.data },
    source: result.source,
    durationMs,
    cacheEnabled,
  });
});

app.get("/customers/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid customer id" }, 400);
  }

  const cacheEnabled = resolveCacheEnabled(c.req.query("cache"));
  const started = performance.now();
  const result = await cacheAside({
    key: `customer:${id}`,
    keyPrefix: "customer",
    enabled: cacheEnabled,
    load: () => getCustomerWithOrders(id),
  });
  const durationMs = Number((performance.now() - started).toFixed(2));

  if (!result.data) {
    return c.json({ error: "Customer not found", durationMs, source: result.source }, 404);
  }

  return c.json({
    data: result.data,
    source: result.source,
    durationMs,
    cacheEnabled,
  });
});

app.get("/reports/top-products", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 20), 100);
  const cacheEnabled = resolveCacheEnabled(c.req.query("cache"));
  const started = performance.now();
  const result = await cacheAside({
    key: `top_products:${limit}`,
    keyPrefix: "top_products",
    enabled: cacheEnabled,
    load: () => getTopProducts(limit),
  });
  const durationMs = Number((performance.now() - started).toFixed(2));

  return c.json({
    data: result.data,
    source: result.source,
    durationMs,
    cacheEnabled,
    limit,
  });
});

app.post("/orders", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const payload = body as {
    customer_id?: number;
    items?: Array<{ product_id?: number; qty?: number }>;
  };

  if (
    !payload.customer_id ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    return c.json(
      { error: "Body must include customer_id and a non-empty items array" },
      400,
    );
  }

  const items = payload.items.map((item) => ({
    product_id: Number(item.product_id),
    qty: Number(item.qty),
  }));

  if (
    items.some(
      (item) =>
        !Number.isFinite(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isFinite(item.qty) ||
        item.qty <= 0,
    )
  ) {
    return c.json({ error: "Each item needs positive product_id and qty" }, 400);
  }

  const started = performance.now();
  const order = await createOrder({
    customer_id: Number(payload.customer_id),
    items,
  });
  if (!order) {
    return c.json({ error: "Customer or products not found" }, 404);
  }

  const keysToInvalidate = [
    `customer:${order.customer_id}`,
    "top_products:20",
    "top_products:50",
    "top_products:100",
    ...order.items.map((item) => `product_stats:${item.product_id}`),
  ];
  await invalidateKeys(keysToInvalidate);

  const durationMs = Number((performance.now() - started).toFixed(2));
  return c.json(
    {
      data: order,
      source: "postgres",
      durationMs,
      invalidatedKeys: keysToInvalidate,
    },
    201,
  );
});

async function start() {
  await connectRedis();
  await pingDb();

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Cache-aside API listening on http://localhost:${info.port}`);
    console.log(
      `Cache enabled by default: ${resolveCacheEnabled()} (override with ?cache=off|on)`,
    );
  });
}

start().catch(async (error) => {
  console.error("Failed to start server:", error);
  await sql.end({ timeout: 1 });
  process.exit(1);
});
