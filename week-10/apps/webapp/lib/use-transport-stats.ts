"use client";

import { useCallback, useRef, useState } from "react";

/**
 * La columna "costo por cliente" de la tabla comparativa, pero como número que
 * sube en pantalla. Es lo que hace discutible la elección del mecanismo: sin
 * esto, los cinco demos se ven igual de rápidos.
 */

export type TransportStats = {
  /** Peticiones o mensajes que salieron del navegador. */
  requests: number;
  /** Respuestas que no traían nada nuevo — el desperdicio del polling. */
  wasted: number;
  /** Eventos de datos efectivamente recibidos. */
  events: number;
  /** Bytes de payload recibidos. */
  bytes: number;
  /** Conexiones abiertas ahora mismo. */
  open: number;
  /** Milisegundos entre que el servidor generó el dato y el navegador lo pintó. */
  lagMs: number | null;
};

const EMPTY: TransportStats = {
  requests: 0,
  wasted: 0,
  events: 0,
  bytes: 0,
  open: 0,
  lagMs: null,
};

export function useTransportStats() {
  const [stats, setStats] = useState<TransportStats>(EMPTY);
  const startedAt = useRef<number | null>(null);

  const record = useCallback((delta: Partial<TransportStats>) => {
    setStats((prev) => ({
      requests: prev.requests + (delta.requests ?? 0),
      wasted: prev.wasted + (delta.wasted ?? 0),
      events: prev.events + (delta.events ?? 0),
      bytes: prev.bytes + (delta.bytes ?? 0),
      open: delta.open ?? prev.open,
      lagMs: delta.lagMs ?? prev.lagMs,
    }));
  }, []);

  const reset = useCallback(() => {
    startedAt.current = Date.now();
    setStats(EMPTY);
  }, []);

  return { stats, record, reset };
}
