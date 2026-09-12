import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { WEBHOOK_SECRET, sign } from "./sign.js";

/**
 * La pasarela de pago externa del diagrama:
 *
 *     Externo (esta app) → Nuestra API → SSE → Navegador
 *
 * El navegador nunca recibe el webhook. Lo recibe un servidor, y ese servidor
 * decide cómo se lo cuenta al navegador.
 */

const app = new Hono();

const API_WEBHOOK_URL =
  process.env.API_WEBHOOK_URL ?? "http://localhost:3001/webhooks/payments";

app.use("/*", cors({ origin: "http://localhost:3000", allowMethods: ["POST", "OPTIONS"] }));

const CUSTOMERS = ["Ana Cruz", "Luis Pérez", "Marta Gómez", "Diego Ruiz"];

type Delivery = { status: number; body: unknown };

async function deliver(rawBody: string, tamper: boolean): Promise<Delivery> {
  const signature = sign(rawBody, WEBHOOK_SECRET);
  const response = await fetch(API_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // `tamper` cambia un carácter de la firma para ver el 401 del otro lado.
      "X-Gateway-Signature": tamper ? `${signature.slice(0, -1)}0` : signature,
    },
    body: rawBody,
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

app.post("/charge", async (c) => {
  const tamper = c.req.query("tamper") === "1";
  const deliveries = Math.min(Number(c.req.query("duplicate") ?? 1), 3);

  const event = {
    id: `evt_${crypto.randomUUID().slice(0, 8)}`,
    type: "payment.succeeded" as const,
    amount: 1000 + Math.floor(Math.random() * 9000),
    currency: "GTQ" as const,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]!,
  };

  // El mismo id, entregado varias veces: así se reintenta en la vida real.
  const rawBody = JSON.stringify(event);
  const results: Delivery[] = [];
  for (let attempt = 0; attempt < deliveries; attempt += 1) {
    results.push(await deliver(rawBody, tamper));
  }

  console.log(
    `charge ${event.id} → ${deliveries} entrega(s), respuestas ${results.map((r) => r.status).join(", ")}`,
  );

  return c.json({ event, deliveries: results });
});

const port = 3002;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Pasarela externa corriendo en http://localhost:${port}`);
  console.log(`  destino: ${API_WEBHOOK_URL}`);
  console.log(`  secreto: ${WEBHOOK_SECRET}`);
  console.log(`  curl -XPOST localhost:${port}/charge`);
  console.log(`  curl -XPOST "localhost:${port}/charge?duplicate=2"   # reintento`);
  console.log(`  curl -XPOST "localhost:${port}/charge?tamper=1"      # firma inválida`);
});
