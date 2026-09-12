import { z } from "zod";

/** El cuerpo que nos manda la pasarela. Se valida igual que cualquier POST público. */
export const webhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["payment.succeeded", "payment.failed"]),
  amount: z.number().int().positive(),
  currency: z.enum(["GTQ", "USD"]),
  customer: z.string().min(1),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

/** Lo que la API publica al navegador después de procesar el webhook. */
export type PaymentRecord = WebhookEvent & {
  receivedAt: number;
  duplicate: boolean;
};

const cardMoveSchema = z.object({
  type: z.literal("card:move"),
  cardId: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  seq: z.number().int().nonnegative(),
});

const helloSchema = z.object({
  type: z.literal("hello"),
  clientId: z.string().min(1),
  lastSeq: z.number().int().nonnegative(),
});

const pongSchema = z.object({ type: z.literal("pong") });

/**
 * Aquí no corren los pipes de la capa REST: un WebSocket entrega strings sin
 * pasar por ningún middleware, así que cada mensaje se valida a mano.
 */
export const boardMessageSchema = z.discriminatedUnion("type", [
  helloSchema,
  cardMoveSchema,
  pongSchema,
]);

export type BoardMessage = z.infer<typeof boardMessageSchema>;
export type CardMove = z.infer<typeof cardMoveSchema>;
