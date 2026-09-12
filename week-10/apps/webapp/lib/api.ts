export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3002";

export const WS_URL = API_URL.replace(/^http/, "ws");

export type JobStage = "queue" | "parse" | "insert" | "done";

export type JobSnapshot = {
  jobId: string;
  stage: JobStage;
  rows: number;
  total: number;
  pct: number;
  /** Marca de tiempo del servidor: `Date.now() - at` es el retraso observado. */
  at: number;
  seq: number;
};

export type JobEvent = Omit<JobSnapshot, "seq">;

export type PaymentRecord = {
  id: string;
  type: "payment.succeeded" | "payment.failed";
  amount: number;
  currency: "GTQ" | "USD";
  customer: string;
  receivedAt: number;
  duplicate: boolean;
};

export type Card = { id: string; label: string; x: number; y: number };

/** Lleva el estado y el cuerpo para distinguir un 401 de un 404. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function startJob(): Promise<{ jobId: string; tickMs: number }> {
  const res = await fetch(`${API_URL}/jobs`, { method: "POST" });
  if (!res.ok) throw new ApiError(res.status, "No se pudo arrancar el job");
  return res.json() as Promise<{ jobId: string; tickMs: number }>;
}

/**
 * Una sola lectura del snapshot. Devuelve también los bytes recibidos porque la
 * página necesita mostrar el costo acumulado, no solo el dato.
 */
export async function fetchJob(
  jobId: string,
  etag?: string,
): Promise<{ snapshot: JobSnapshot | null; etag: string | null; bytes: number; notModified: boolean }> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    headers: etag ? { "If-None-Match": etag } : undefined,
  });

  if (res.status === 304) {
    return { snapshot: null, etag: etag ?? null, bytes: 0, notModified: true };
  }
  if (!res.ok) throw new ApiError(res.status, "No se pudo leer el job");

  const text = await res.text();
  return {
    snapshot: JSON.parse(text) as JobSnapshot,
    etag: res.headers.get("ETag"),
    bytes: new TextEncoder().encode(text).length,
    notModified: false,
  };
}

export type LongPollResult =
  | { kind: "events"; cursor: number; events: JobEvent[]; bytes: number }
  | { kind: "timeout" };

/** La petición que el servidor retiene. `signal` permite cancelarla al desmontar. */
export async function waitForJob(
  jobId: string,
  cursor: number,
  signal: AbortSignal,
): Promise<LongPollResult> {
  const res = await fetch(`${API_URL}/jobs/${jobId}/wait?cursor=${cursor}`, { signal });

  if (res.status === 204) return { kind: "timeout" };
  if (!res.ok) throw new ApiError(res.status, "Falló el long polling");

  const text = await res.text();
  const body = JSON.parse(text) as { cursor: number; events: JobEvent[] };
  return {
    kind: "events",
    cursor: body.cursor,
    events: body.events,
    bytes: new TextEncoder().encode(text).length,
  };
}

export type ChargeMode = "normal" | "duplicate" | "tamper";

/** Le pedimos a la pasarela externa que nos mande un webhook. */
export async function simulateCharge(mode: ChargeMode) {
  const query =
    mode === "duplicate" ? "?duplicate=2" : mode === "tamper" ? "?tamper=1" : "";
  const res = await fetch(`${GATEWAY_URL}/charge${query}`, { method: "POST" });
  if (!res.ok) throw new ApiError(res.status, "La pasarela no respondió");
  return res.json() as Promise<{
    event: { id: string };
    deliveries: { status: number; body: { duplicate?: boolean } | null }[];
  }>;
}

export async function fetchBoard(boardId: string): Promise<{ cards: Card[]; lastSeq: number }> {
  const res = await fetch(`${API_URL}/board/${boardId}`);
  if (!res.ok) throw new ApiError(res.status, "No se pudo leer la pizarra");
  return res.json() as Promise<{ cards: Card[]; lastSeq: number }>;
}
