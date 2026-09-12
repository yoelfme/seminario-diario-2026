import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import * as board from "./board-hub.js";
import { EventLog } from "./event-log.js";
import { JOB_TICK_MS, TOTAL_ROWS, getJob, latestJob, startJob } from "./jobs.js";
import { boardMessageSchema, webhookEventSchema } from "./schemas.js";
import type { PaymentRecord } from "./schemas.js";
import { SIGNATURE_HEADER, WEBHOOK_SECRET, verify } from "./webhook-signature.js";

const app = new Hono();
const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

/** Cuánto retiene el servidor una petición de long polling antes de rendirse. */
const LONG_POLL_TIMEOUT_MS = Number(process.env.LONG_POLL_TIMEOUT_MS ?? 25_000);

/** Los pagos que la pasarela nos empujó, en un solo registro compartido. */
const payments = new EventLog<PaymentRecord>();
const seenWebhookIds = new Set<string>();

// Contadores para que la página pueda mostrar el "costo por cliente" del lado servidor.
const hits = { polling: 0, longPolling: 0, sse: 0, webhooks: 0 };

app.use(
  "/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "OPTIONS"],
    // If-None-Match no está en la lista blanca del navegador: sin declararlo,
    // el preflight bloquea la petición condicional del polling.
    allowHeaders: ["Content-Type", "If-None-Match", SIGNATURE_HEADER],
    // Y sin exponer ETag, `res.headers.get("ETag")` devuelve null en el cliente
    // y el 304 nunca llega a ocurrir.
    exposeHeaders: ["ETag"],
    // Sin esto el navegador manda un OPTIONS antes de cada GET condicional y
    // el costo real del polling queda al doble de lo que muestra la página.
    maxAge: 600,
  }),
);

// ---------------------------------------------------------------------------
// El trabajo que observan los cuatro mecanismos servidor → cliente
// ---------------------------------------------------------------------------

app.post("/jobs", (c) => {
  const job = startJob();
  return c.json({ jobId: job.id, total: TOTAL_ROWS, tickMs: JOB_TICK_MS }, 201);
});

app.get("/jobs/latest", (c) => {
  const job = latestJob();
  if (!job) return c.json({ error: "No hay ningún job en curso" }, 404);
  return c.json({ ...job.snapshot, lastSeq: job.log.lastSeq });
});

// --- MECANISMO 01 · Polling -------------------------------------------------
// Un endpoint REST normal. Lo interesante es el ETag: la respuesta es cacheable
// y depurable, pero el cliente la vuelve a pedir igual, y casi siempre para
// recibir lo mismo que ya tenía.
app.get("/jobs/:id", (c) => {
  hits.polling += 1;
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job no encontrado" }, 404);

  const etag = `"${job.id}-${job.log.lastSeq}"`;
  if (c.req.header("If-None-Match") === etag) {
    return c.body(null, 304, { ETag: etag });
  }

  c.header("ETag", etag);
  return c.json({ ...job.snapshot, seq: job.log.lastSeq });
});

// --- MECANISMO 02 · Long polling --------------------------------------------
// La petición no responde hasta que hay novedad. `EventLog.wait` la retiene sin
// consumir CPU; al expirar devolvemos 204 y el cliente vuelve a preguntar.
app.get("/jobs/:id/wait", async (c) => {
  hits.longPolling += 1;
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job no encontrado" }, 404);

  const cursor = Number(c.req.query("cursor") ?? 0);
  const events = await job.log.wait(cursor, LONG_POLL_TIMEOUT_MS);

  if (events.length === 0) {
    // 204: "no pasó nada en 25 s". No es un error, es el ciclo normal.
    return c.body(null, 204);
  }

  const last = events[events.length - 1];
  return c.json({ cursor: last!.seq, events: events.map((e) => e.data) });
});

// --- MECANISMO 04 · Server-Sent Events --------------------------------------
// Un flujo HTTP que no se cierra. El navegador reconecta solo y reenvía
// `Last-Event-ID`, así que la recuperación es una línea de código, no un diseño.
app.get("/jobs/:id/events", (c) => {
  hits.sse += 1;
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "Job no encontrado" }, 404);

  return streamSSE(c, async (stream) => {
    // El navegador manda esta cabecera él solo al reconectar.
    const lastEventId = Number(c.req.header("Last-Event-ID") ?? 0);

    await stream.writeSSE({ data: String(JOB_TICK_MS), event: "hello", retry: 3000 });

    // Primero lo que se perdió, luego lo que venga en vivo.
    for (const missed of job.log.since(lastEventId)) {
      await stream.writeSSE({
        id: String(missed.seq),
        event: "progress",
        data: JSON.stringify(missed.data),
      });
    }

    await new Promise<void>((resolve) => {
      const unsubscribe = job.log.subscribe((event) => {
        void stream.writeSSE({
          id: String(event.seq),
          event: "progress",
          data: JSON.stringify(event.data),
        });
      });

      // Sin esto cada pestaña cerrada deja un suscriptor escribiendo al vacío.
      stream.onAbort(() => {
        unsubscribe();
        resolve();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// MECANISMO 03 · Webhooks
// ---------------------------------------------------------------------------

app.post("/webhooks/payments", async (c) => {
  hits.webhooks += 1;

  // El HMAC se calcula sobre los bytes. Si parseamos antes y volvemos a
  // serializar, cualquier diferencia de formato rompe la firma.
  const rawBody = await c.req.text();
  const result = verify(rawBody, c.req.header(SIGNATURE_HEADER), WEBHOOK_SECRET);
  if (!result.ok) {
    return c.json({ error: "Firma inválida", reason: result.reason }, 401);
  }

  const parsed = webhookEventSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    return c.json({ error: "Cuerpo inválido", issues: parsed.error.issues }, 400);
  }
  const event = parsed.data;

  // El reintento es la norma: la misma entrega puede llegar dos veces y el
  // efecto tiene que ser el mismo que si llegara una.
  const duplicate = seenWebhookIds.has(event.id);
  if (!duplicate) {
    seenWebhookIds.add(event.id);
  }

  // Responder 2xx rápido y procesar aparte: si trabajamos antes de responder,
  // la pasarela nos marca como caídos y reintenta.
  setTimeout(() => {
    if (duplicate) return;
    payments.append({ ...event, receivedAt: Date.now(), duplicate });
  }, 50);

  return c.json({ received: true, duplicate }, 202);
});

/** El puente del diagrama: el evento de un tercero llega al navegador por SSE. */
app.get("/payments/stream", (c) => {
  return streamSSE(c, async (stream) => {
    const lastEventId = Number(c.req.header("Last-Event-ID") ?? 0);

    await stream.writeSSE({ data: "ok", event: "hello", retry: 3000 });

    for (const missed of payments.since(lastEventId)) {
      await stream.writeSSE({
        id: String(missed.seq),
        event: "payment",
        data: JSON.stringify(missed.data),
      });
    }

    await new Promise<void>((resolve) => {
      const unsubscribe = payments.subscribe((event) => {
        void stream.writeSSE({
          id: String(event.seq),
          event: "payment",
          data: JSON.stringify(event.data),
        });
      });
      stream.onAbort(() => {
        unsubscribe();
        resolve();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// MECANISMO 05 · WebSockets
// ---------------------------------------------------------------------------

app.get("/board/:id", (c) => c.json(board.snapshot(c.req.param("id"))));

app.get(
  "/board/:id/ws",
  upgradeWebSocket((c) => {
    const boardId = c.req.param("id") ?? "demo";
    // Autenticar en el upgrade, no en el primer mensaje: un socket abierto ya
    // consume recursos. Aquí el clientId llega por query para no complicar la demo.
    const clientId = c.req.query("clientId") ?? crypto.randomUUID().slice(0, 6);
    let member: board.Member | null = null;

    return {
      onOpen(_evt, ws) {
        // El welcome antes del join: así el cliente recibe el estado inicial
        // antes que el presence que lo incluye a él mismo.
        const { cards, lastSeq } = board.snapshot(boardId);
        ws.send(JSON.stringify({ type: "welcome", clientId, cards, lastSeq }));
        member = board.join(boardId, ws, clientId);
      },

      onMessage(evt, ws) {
        const parsed = boardMessageSchema.safeParse(
          JSON.parse(String(evt.data ?? "{}")),
        );
        if (!parsed.success) {
          ws.send(JSON.stringify({ type: "error", error: "Mensaje inválido" }));
          return;
        }
        const message = parsed.data;

        if (message.type === "pong") {
          if (member) board.markAlive(member);
          return;
        }

        if (message.type === "hello") {
          // Reconexión: el cliente dice hasta dónde llegó y le damos el diferencial.
          const missed = board.since(boardId, message.lastSeq);
          ws.send(JSON.stringify({ type: "catch-up", events: missed }));
          return;
        }

        const applied = board.applyMove(boardId, message, clientId);
        if (!applied) {
          ws.send(JSON.stringify({ type: "error", error: "Tarjeta no encontrada" }));
          return;
        }

        // El ack viaja de vuelta: el cliente sabe que su acción llegó.
        ws.send(JSON.stringify({ type: "ack", seq: applied.seq, clientSeq: message.seq }));
      },

      onClose() {
        if (member) board.leave(boardId, member);
      },
    };
  }),
);

// ---------------------------------------------------------------------------

app.get("/stats", (c) =>
  c.json({ ...hits, openSockets: board.socketCount(), sseSecret: undefined }),
);

const port = 3001;

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`API corriendo en http://localhost:${port}`);
  console.log(`  job:          ${TOTAL_ROWS} filas, tick de ${JOB_TICK_MS}ms`);
  console.log(`  long polling: retiene hasta ${LONG_POLL_TIMEOUT_MS}ms`);
  console.log(`  heartbeat ws: ping cada ${board.HEARTBEAT_MS}ms`);
  console.log(`  webhook:      secreto ${WEBHOOK_SECRET}`);
});

// El upgrade a WebSocket necesita el servidor HTTP real, no solo app.fetch.
injectWebSocket(server);

board.startHeartbeat();
