/**
 * Un registro de eventos numerado, en memoria.
 *
 * Las tres recuperaciones que pide la charla son la misma operación sobre una
 * secuencia monótona: el `?cursor=` del long polling, el `Last-Event-ID` de SSE
 * y el `hello { lastSeq }` del WebSocket preguntan todos "¿qué me perdí después
 * del evento N?". Por eso hay una sola clase y no tres.
 */

export type LoggedEvent<T> = { seq: number; data: T };

type Waiter<T> = {
  cursor: number;
  resolve: (events: LoggedEvent<T>[]) => void;
  timer: NodeJS.Timeout;
};

/** Cuántos eventos guardamos para poder reenviarlos. En producción esto vive en Redis. */
const BUFFER_SIZE = 200;

export class EventLog<T> {
  #events: LoggedEvent<T>[] = [];
  #seq = 0;
  #waiters = new Set<Waiter<T>>();
  #subscribers = new Set<(event: LoggedEvent<T>) => void>();

  get lastSeq(): number {
    return this.#seq;
  }

  append(data: T): LoggedEvent<T> {
    const event: LoggedEvent<T> = { seq: ++this.#seq, data };
    this.#events.push(event);

    // Buffer circular: sin techo, una demo de media hora se come la memoria.
    if (this.#events.length > BUFFER_SIZE) {
      this.#events.shift();
    }

    // Primero los que esperan (long polling), luego los suscritos (SSE y WS).
    for (const waiter of this.#waiters) {
      clearTimeout(waiter.timer);
      this.#waiters.delete(waiter);
      waiter.resolve(this.since(waiter.cursor));
    }

    for (const notify of this.#subscribers) {
      notify(event);
    }

    return event;
  }

  /** Todo lo ocurrido después de `cursor`. Un cursor de 0 devuelve el buffer completo. */
  since(cursor: number): LoggedEvent<T>[] {
    return this.#events.filter((event) => event.seq > cursor);
  }

  /**
   * Long polling: si ya hay novedad la devuelve de inmediato; si no, retiene la
   * promesa hasta que llegue un evento o se agote el tiempo. Nunca hace
   * busy-loop — es la diferencia entre long polling y polling disfrazado.
   */
  wait(cursor: number, timeoutMs: number): Promise<LoggedEvent<T>[]> {
    const pending = this.since(cursor);
    if (pending.length > 0) {
      return Promise.resolve(pending);
    }

    return new Promise((resolve) => {
      const waiter: Waiter<T> = {
        cursor,
        resolve,
        timer: setTimeout(() => {
          this.#waiters.delete(waiter);
          resolve([]);
        }, timeoutMs),
      };
      this.#waiters.add(waiter);
    });
  }

  /** Devuelve la función para darse de baja; el llamador debe invocarla al cerrar. */
  subscribe(onEvent: (event: LoggedEvent<T>) => void): () => void {
    this.#subscribers.add(onEvent);
    return () => {
      this.#subscribers.delete(onEvent);
    };
  }

  get subscriberCount(): number {
    return this.#subscribers.size;
  }

  get waiterCount(): number {
    return this.#waiters.size;
  }
}
