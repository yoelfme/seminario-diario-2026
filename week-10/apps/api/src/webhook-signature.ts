import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma de webhook al estilo de las pasarelas reales (Stripe, Shopify):
 *
 *     X-Gateway-Signature: t=1757600000,v1=<hmac sha256 de "t.cuerpo">
 *
 * El timestamp entra en el HMAC para que una entrega capturada no se pueda
 * reenviar mañana: sin él, la firma sería válida para siempre.
 */

export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "whsec_seminario_2026";
export const SIGNATURE_HEADER = "X-Gateway-Signature";

/** Fuera de esta ventana rechazamos aunque la firma cuadre. */
const TOLERANCE_MS = 5 * 60 * 1000;

export function sign(rawBody: string, secret: string, timestamp = Date.now()): string {
  const seconds = Math.floor(timestamp / 1000);
  const digest = createHmac("sha256", secret)
    .update(`${seconds}.${rawBody}`)
    .digest("hex");
  return `t=${seconds},v1=${digest}`;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "malformed" | "expired" | "mismatch" };

export function verify(
  rawBody: string,
  header: string | undefined,
  secret: string,
): VerifyResult {
  if (!header) return { ok: false, reason: "missing" };

  const parts = new Map(
    header.split(",").map((pair) => {
      const [key, value] = pair.split("=");
      return [key?.trim() ?? "", value?.trim() ?? ""];
    }),
  );
  const timestamp = Number(parts.get("t"));
  const received = parts.get("v1");
  if (!Number.isFinite(timestamp) || !received) {
    return { ok: false, reason: "malformed" };
  }

  if (Math.abs(Date.now() - timestamp * 1000) > TOLERANCE_MS) {
    return { ok: false, reason: "expired" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  // Comparar con === filtra el secreto por el tiempo que tarda en fallar.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "mismatch" };
  }

  return { ok: true };
}
