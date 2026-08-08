import { createHash } from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { StatusCode } from "hono/utils/http-status";
import { db } from "./db.js";

// Unlike `registrations` — which is deliberately constraint-free so the Zod
// lesson has teeth — this table's constraints ARE the feature. The composite
// PRIMARY KEY is the lock: two concurrent requests carrying the same key race
// to INSERT, and SQLite lets exactly one win.
db.exec(`
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    endpoint         TEXT NOT NULL,
    key              TEXT NOT NULL,
    fingerprint      TEXT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('processing', 'completed')),
    response_status  INTEGER,
    response_body    TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at     TEXT,
    PRIMARY KEY (endpoint, key)
  );
`);

// A crash mid-request leaves a 'processing' row behind, which would 409 that
// key forever. Nothing is in flight at boot, so any such row is orphaned.
db.prepare(`DELETE FROM idempotency_keys WHERE status = 'processing'`).run();
db.prepare(
  `DELETE FROM idempotency_keys WHERE created_at < datetime('now', '-24 hours')`,
).run();

type IdempotencyRow = {
  endpoint: string;
  key: string;
  fingerprint: string;
  status: "processing" | "completed";
  response_status: number | null;
  response_body: string | null;
  created_at: string;
  completed_at: string | null;
};

const reserveKey = db.prepare(`
  INSERT INTO idempotency_keys (endpoint, key, fingerprint, status)
  VALUES (?, ?, ?, 'processing')
`);

const findKey = db.prepare(`
  SELECT * FROM idempotency_keys WHERE endpoint = ? AND key = ?
`);

const completeKey = db.prepare(`
  UPDATE idempotency_keys
  SET status = 'completed',
      response_status = ?,
      response_body = ?,
      completed_at = datetime('now')
  WHERE endpoint = ? AND key = ?
`);

const releaseKey = db.prepare(`
  DELETE FROM idempotency_keys WHERE endpoint = ? AND key = ?
`);

/**
 * Stable JSON: object keys are sorted recursively so that `{a,b}` and `{b,a}`
 * fingerprint identically. Two requests are "the same request" only if their
 * payloads are the same, regardless of how the client serialised them.
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`);
  return `{${entries.join(",")}}`;
}

function fingerprintOf(body: unknown): string {
  return createHash("sha256").update(canonicalize(body)).digest("hex");
}

function isPrimaryKeyConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code: unknown }).code).startsWith(
      "SQLITE_CONSTRAINT_PRIMARYKEY",
    )
  );
}

/**
 * Demo switch. Start the API with `IDEMPOTENCY=off` to run it exactly as it
 * behaved before this file existed — no header required, no deduplication —
 * so the duplicate-registration problem can be shown before the fix.
 */
export const IDEMPOTENCY_ENABLED = process.env.IDEMPOTENCY !== "off";

/**
 * Requires an `Idempotency-Key` header and guarantees the wrapped handler runs
 * at most once per (endpoint, key). Mount it AFTER the validator so a rejected
 * payload can never burn a key.
 *
 * Status codes follow draft-ietf-httpapi-idempotency-key-header:
 *   409 — the original request with this key is still in flight
 *   422 — this key was already used with a different payload
 */
export const idempotency = (endpoint: string) =>
  createMiddleware(async (c, next) => {
    if (!IDEMPOTENCY_ENABLED) return next();

    const key = c.req.header("Idempotency-Key")?.trim();

    if (!key) {
      return c.json(
        {
          error: "Idempotency-Key header is required",
          detail:
            "Send a unique key (e.g. a UUID) per logical operation, and reuse it when retrying that same operation.",
        },
        400,
      );
    }

    // Hono caches the parsed body, so the validator's own read costs nothing.
    const fingerprint = fingerprintOf(await c.req.json());

    try {
      reserveKey.run(endpoint, key, fingerprint);
    } catch (error) {
      if (!isPrimaryKeyConflict(error)) throw error;

      const existing = findKey.get(endpoint, key) as IdempotencyRow | undefined;

      // Lost the race and the winner already finished and cleaned up.
      if (!existing) {
        return c.json({ error: "Idempotency key is being replayed" }, 409);
      }

      if (existing.fingerprint !== fingerprint) {
        return c.json(
          {
            error: "Idempotency-Key was already used with a different payload",
            detail:
              "A key identifies one specific request. Use a new key for a different payload.",
          },
          422,
        );
      }

      if (existing.status === "processing") {
        return c.json(
          {
            error: "A request with this Idempotency-Key is already in progress",
            detail: "Retry once the original request has completed.",
          },
          409,
        );
      }

      // Both columns are written together when the row flips to 'completed'.
      const replayStatus = (existing.response_status ?? 200) as StatusCode;
      return c.newResponse(existing.response_body, replayStatus, {
        "Content-Type": "application/json",
        "Idempotency-Replayed": "true",
      });
    }

    c.header("Idempotency-Replayed", "false");

    try {
      await next();
    } catch (error) {
      releaseKey.run(endpoint, key);
      throw error;
    }

    // Only successful outcomes are worth replaying. Releasing the key on an
    // error lets the client legitimately retry the same operation.
    if (c.res.status >= 200 && c.res.status < 300) {
      const body = await c.res.clone().text();
      completeKey.run(c.res.status, body, endpoint, key);
    } else {
      releaseKey.run(endpoint, key);
    }
  });
