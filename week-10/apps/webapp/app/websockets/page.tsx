"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EventConsole, { type LogLine } from "../components/event-console";
import MechanismHeader from "../components/mechanism-header";
import { WS_URL, type Card } from "@/lib/api";
import { useReconnect } from "@/lib/use-reconnect";

const BOARD_ID = "42";

/** A 50 ms el arrastre se ve fluido y no inundamos el socket con cada píxel. */
const SEND_THROTTLE_MS = 50;

type ServerMessage =
  | { type: "welcome"; clientId: string; cards: Card[]; lastSeq: number }
  | { type: "presence"; clients: string[] }
  | { type: "card:moved"; cardId: string; x: number; y: number; by: string; seq: number }
  | { type: "catch-up"; events: { cardId: string; x: number; y: number; seq: number }[] }
  | { type: "ack"; seq: number; clientSeq: number }
  | { type: "ping" }
  | { type: "error"; error: string };

export default function WebSocketsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [state, setState] = useState<"cerrado" | "conectando" | "abierto">("conectando");
  const [lastAck, setLastAck] = useState<{ seq: number; clientSeq: number } | null>(null);
  const [lines, setLines] = useState<LogLine[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>("");
  const lastSeqRef = useRef(0);
  const clientSeqRef = useRef(0);
  const lastSentAt = useRef(0);
  const { nextDelay, reset: resetBackoff } = useReconnect();

  const log = useCallback((kind: LogLine["kind"], text: string) => {
    setLines((prev) => [...prev.slice(-80), { at: Date.now(), kind, text }]);
  }, []);

  /** Idempotente: un seq que ya aplicamos se descarta, venga en vivo o en el catch-up. */
  const applyMoved = useCallback(
    (move: { cardId: string; x: number; y: number; seq: number }) => {
      if (move.seq <= lastSeqRef.current) {
        log("info", `seq ${move.seq} descartado — ya lo habíamos aplicado`);
        return;
      }
      lastSeqRef.current = move.seq;
      setCards((prev) =>
        prev.map((card) =>
          card.id === move.cardId ? { ...card, x: move.x, y: move.y } : card,
        ),
      );
    },
    [log],
  );

  useEffect(() => {
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    if (!clientIdRef.current) {
      clientIdRef.current = Math.random().toString(36).slice(2, 8);
    }

    function connect() {
      if (disposed) return;
      setState("conectando");
      const socket = new WebSocket(
        `${WS_URL}/board/${BOARD_ID}/ws?clientId=${clientIdRef.current}`,
      );
      socketRef.current = socket;

      socket.onopen = () => {
        setState("abierto");
        resetBackoff();
        log("info", `socket abierto como ${clientIdRef.current}`);
        // Reconexión: pedimos el diferencial desde donde quedamos.
        if (lastSeqRef.current > 0) {
          socket.send(
            JSON.stringify({
              type: "hello",
              clientId: clientIdRef.current,
              lastSeq: lastSeqRef.current,
            }),
          );
          log("out", `hello lastSeq=${lastSeqRef.current} — pidiendo el diferencial`);
        }
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;

        switch (message.type) {
          case "welcome":
            setCards(message.cards);
            if (lastSeqRef.current === 0) lastSeqRef.current = message.lastSeq;
            log("in", `welcome — ${message.cards.length} tarjetas, lastSeq ${message.lastSeq}`);
            break;
          case "presence":
            setClients(message.clients);
            break;
          case "card:moved":
            applyMoved(message);
            log("in", `${message.by} movió ${message.cardId} (seq ${message.seq})`);
            break;
          case "catch-up":
            log("in", `catch-up — ${message.events.length} evento(s) perdidos`);
            for (const missed of message.events) applyMoved(missed);
            break;
          case "ack":
            setLastAck({ seq: message.seq, clientSeq: message.clientSeq });
            lastSeqRef.current = Math.max(lastSeqRef.current, message.seq);
            break;
          case "ping":
            // Si no contestamos, el servidor nos cierra tras dos pings.
            socket.send(JSON.stringify({ type: "pong" }));
            break;
          case "error":
            log("warn", `el servidor rechazó el mensaje: ${message.error}`);
            break;
        }
      };

      socket.onclose = () => {
        setState("cerrado");
        setClients([]);
        if (disposed) return;
        const { attempt, delayMs } = nextDelay();
        log("warn", `socket cerrado — intento ${attempt} en ${delayMs} ms (backoff con jitter)`);
        retryTimer = setTimeout(connect, delayMs);
      };
    }

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [applyMoved, log, nextDelay, resetBackoff]);

  function sendMove(cardId: string, x: number, y: number, force = false) {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if (!force && now - lastSentAt.current < SEND_THROTTLE_MS) return;
    lastSentAt.current = now;

    clientSeqRef.current += 1;
    socket.send(
      JSON.stringify({ type: "card:move", cardId, x, y, seq: clientSeqRef.current }),
    );
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>, cardId: string) {
    const board = event.currentTarget.parentElement;
    if (!board) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (pointer: PointerEvent) => {
      const rect = board.getBoundingClientRect();
      const x = Math.min(92, Math.max(0, ((pointer.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(82, Math.max(0, ((pointer.clientY - rect.top) / rect.height) * 100));
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, x, y } : card)),
      );
      sendMove(cardId, Math.round(x), Math.round(y));
    };

    const up = (pointer: PointerEvent) => {
      move(pointer);
      const rect = board.getBoundingClientRect();
      const x = Math.min(92, Math.max(0, ((pointer.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(82, Math.max(0, ((pointer.clientY - rect.top) / rect.height) * 100));
      sendMove(cardId, Math.round(x), Math.round(y), true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /** Para proyectar sin ratón, y para que la demo se pueda guionar. */
  function shuffle() {
    const card = cards[Math.floor(Math.random() * cards.length)];
    if (!card) return;
    const x = Math.floor(Math.random() * 85);
    const y = Math.floor(Math.random() * 75);
    // El servidor reparte al resto del canal, nunca al emisor: quien manda el
    // movimiento lo pinta localmente y espera el ack, igual que en el arrastre.
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, x, y } : c)));
    sendMove(card.id, x, y, true);
  }

  return (
    <div className="space-y-6">
      <MechanismHeader
        number="05"
        title="WebSockets: un canal bidireccional persistente"
        subtitle="Handshake HTTP con Upgrade y, a partir de ahí, mensajes en ambos sentidos sobre el mismo socket."
        pros="Latencia simétrica: lo que escribe un cliente llega a los demás sin ciclo de petición."
        cons="Todo lo que SSE regalaba — reconexión, orden, recuperación — ahora lo diseñas tú."
      />

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span
          className={`rounded border px-3 py-1.5 font-mono ${
            state === "abierto"
              ? "border-[var(--success)] text-[var(--success)]"
              : "border-[var(--error)] text-[var(--error)]"
          }`}
        >
          {state}
        </span>
        <span className="font-mono text-[var(--muted)]">
          canal <span className="text-[var(--accent)]">board:{BOARD_ID}</span> · yo soy{" "}
          {clientIdRef.current || "—"} · conectados: {clients.length || 0}
        </span>
        <span className="font-mono text-[var(--muted)]">
          último ack: {lastAck ? `seq ${lastAck.seq} (mi envío ${lastAck.clientSeq})` : "—"}
        </span>
        <button
          type="button"
          onClick={shuffle}
          className="rounded border border-[var(--border)] px-3 py-1.5 transition hover:border-[var(--accent)]"
        >
          Mover una al azar
        </button>
      </div>

      <div className="relative h-80 overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)]">
        {cards.map((card) => (
          <div
            key={card.id}
            onPointerDown={(event) => onPointerDown(event, card.id)}
            style={{ left: `${card.x}%`, top: `${card.y}%` }}
            className="absolute cursor-grab touch-none rounded border border-[var(--accent)] bg-[var(--bg)] px-3 py-2 text-xs select-none active:cursor-grabbing"
          >
            {card.label}
          </div>
        ))}
        {cards.length === 0 ? (
          <p className="p-4 text-sm text-[var(--muted)]">Esperando la pizarra…</p>
        ) : null}
      </div>

      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Para la demo</p>
        <p className="mt-1">
          Abre esta página en dos ventanas y arrastra una tarjeta en una: se mueve en
          la otra, con <code className="font-mono">ack</code> y número de secuencia
          visibles arriba.
        </p>
        <p className="mt-2">
          Luego apaga la API. El log de abajo muestra el backoff con jitter
          (1 s, 2 s, 4 s…, nunca el mismo número dos veces). Al volver, el cliente
          manda <code className="font-mono">hello lastSeq</code> y recupera solo lo
          que se perdió: los seq ya aplicados se descartan.
        </p>
      </div>

      <EventConsole lines={lines} />
    </div>
  );
}
