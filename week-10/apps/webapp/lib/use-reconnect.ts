"use client";

import { useCallback, useRef } from "react";

/**
 * Backoff exponencial con jitter y techo: 1s, 2s, 4s, 8s… hasta 30s.
 *
 * El jitter no es cosmético. Sin él, mil clientes que se cayeron por el mismo
 * corte vuelven exactamente en el mismo milisegundo y tiran el servidor justo
 * cuando acaba de levantarse.
 *
 * Esto es lo que `EventSource` ya trae resuelto y que con WebSocket escribes tú.
 */

const BASE_MS = 1000;
const CEILING_MS = 30_000;

export function useReconnect() {
  const attempt = useRef(0);

  const nextDelay = useCallback((): { attempt: number; delayMs: number } => {
    attempt.current += 1;
    const exponential = Math.min(BASE_MS * 2 ** (attempt.current - 1), CEILING_MS);
    // Jitter completo: un punto al azar dentro de la ventana, no la ventana entera.
    const delayMs = Math.round(exponential * (0.5 + Math.random() * 0.5));
    return { attempt: attempt.current, delayMs };
  }, []);

  const reset = useCallback(() => {
    attempt.current = 0;
  }, []);

  return { nextDelay, reset };
}
