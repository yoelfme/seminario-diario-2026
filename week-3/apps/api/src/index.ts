import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { Hono } from "hono";
import {
  conferenceInfo,
  countRegistrations,
  createRegistration,
  getRegistrations,
} from "./db.js";
import {
  registrationSchema,
  registrationsQuerySchema,
} from "./registration-schema.js";
import { IDEMPOTENCY_ENABLED, idempotency } from "./idempotency.js";

const app = new Hono();

// Artificial latency so the double-submit window is observable in the browser.
// better-sqlite3 is fully synchronous, so without an await the handler never
// yields and two "concurrent" requests can never overlap. Set to 0 to disable.
const REGISTRATION_DELAY_MS = Number(process.env.REGISTRATION_DELAY_MS ?? 2000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

app.use(
  "/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "OPTIONS"],
    // A custom request header must be allow-listed or the browser's preflight
    // blocks it; exposeHeaders lets the page read the replay flag back.
    allowHeaders: ["Content-Type", "Idempotency-Key"],
    exposeHeaders: ["Idempotency-Replayed"],
  }),
);

app.get("/conference", (c) => {
  return c.json(conferenceInfo);
});

app.get(
  "/registrations",
  zValidator("query", registrationsQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Validation failed", issues: result.error.issues },
        400,
      );
    }
  }),
  (c) => {
    const { page, pageSize, email, organization, fullName } =
      c.req.valid("query");
    const offset = (page - 1) * pageSize;
    const filters = { email, organization, fullName };
    const data = getRegistrations(pageSize, offset, filters);
    const total = countRegistrations(filters);

    return c.json({ data, page, pageSize, total });
  },
);

app.post(
  "/registrations",
  zValidator("json", registrationSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Validation failed", issues: result.error.issues },
        400,
      );
    }
  }),
  idempotency("POST /registrations"),
  async (c) => {
    const body = c.req.valid("json");
    await sleep(REGISTRATION_DELAY_MS);
    const registration = createRegistration(body);
    return c.json(registration, 201);
  },
);

const port = 3001;

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running at http://localhost:${port}`);
  console.log(
    `  idempotency: ${IDEMPOTENCY_ENABLED ? "ON" : "OFF (duplicates allowed)"}`,
  );
  console.log(`  POST /registrations delay: ${REGISTRATION_DELAY_MS}ms`);
});
