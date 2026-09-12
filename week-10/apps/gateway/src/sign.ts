import { createHmac } from "node:crypto";

/**
 * Sí, esto está duplicado de `apps/api/src/webhook-signature.ts`. A propósito.
 *
 * Una pasarela de pago de verdad es otra empresa: no importa nuestros módulos
 * ni comparte nuestro repo. Lo único que comparten los dos lados es el secreto
 * y el formato de la cabecera. Ponerlo en un paquete compartido haría la demo
 * más corta y el modelo mental más falso.
 */

export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "whsec_seminario_2026";

export function sign(rawBody: string, secret: string): string {
  const seconds = Math.floor(Date.now() / 1000);
  const digest = createHmac("sha256", secret)
    .update(`${seconds}.${rawBody}`)
    .digest("hex");
  return `t=${seconds},v1=${digest}`;
}
