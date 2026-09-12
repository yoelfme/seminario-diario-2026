"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EventConsole, { type LogLine } from "../components/event-console";
import MechanismHeader from "../components/mechanism-header";
import ProgressBar from "../components/progress-bar";
import TransportStatsPanel from "../components/transport-stats";
import { API_URL, startJob, type JobEvent } from "@/lib/api";
import { useTransportStats } from "@/lib/use-transport-stats";

type ConnectionState = "cerrado" | "conectando" | "abierto";

export default function SsePage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [latest, setLatest] = useState<JobEvent | null>(null);
  const [state, setState] = useState<ConnectionState>("cerrado");
  const [reconnects, setReconnects] = useState(0);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [lines, setLines] = useState<LogLine[]>([]);
  const { stats, record, reset } = useTransportStats();
  const openedOnce = useRef(false);

  const log = useCallback((kind: LogLine["kind"], text: string) => {
    setLines((prev) => [...prev.slice(-80), { at: Date.now(), kind, text }]);
  }, []);

  async function begin() {
    reset();
    setLatest(null);
    setLines([]);
    setReconnects(0);
    setLastEventId(null);
    openedOnce.current = false;
    const job = await startJob();
    setJobId(job.jobId);
    log("info", `job ${job.jobId} arrancado`);
  }

  useEffect(() => {
    if (!jobId) return;

    setState("conectando");
    // Una sola petición HTTP que no termina. El navegador se encarga de
    // reconectar y de reenviar Last-Event-ID: no escribimos nada para eso.
    const source = new EventSource(`${API_URL}/jobs/${jobId}/events`);

    source.addEventListener("open", () => {
      setState("abierto");
      record({ open: 1 });
      if (openedOnce.current) {
        // Reconexión automática: el navegador ya reenvió Last-Event-ID solo.
        setReconnects((n) => n + 1);
        log("info", "reconectado solo — reanudando desde el último id");
      } else {
        openedOnce.current = true;
        record({ requests: 1 });
        log("out", "GET /events — un stream que no se cierra");
      }
    });

    source.addEventListener("hello", (event) => {
      log("in", `hello — el servidor pidió retry de 3000 ms (tick ${(event as MessageEvent<string>).data} ms)`);
    });

    source.addEventListener("progress", (event) => {
      const message = event as MessageEvent<string>;
      const data = JSON.parse(message.data) as JobEvent;
      setLatest(data);
      setLastEventId(message.lastEventId);
      record({ events: 1, bytes: message.data.length, lagMs: Date.now() - data.at });
      log("in", `id ${message.lastEventId} — ${data.rows} filas (${data.pct}%)`);

      if (data.stage === "done") {
        source.close();
        setState("cerrado");
        record({ open: 0 });
        log("info", "job terminado — cerramos el stream desde el cliente");
      }
    });

    source.addEventListener("error", () => {
      setState("conectando");
      record({ open: 0 });
      log("warn", "stream caído — el navegador reintentará solo en ~3 s");
    });

    return () => {
      source.close();
      setState("cerrado");
    };
  }, [jobId, record, log]);

  return (
    <div className="space-y-6">
      <MechanismHeader
        number="04"
        title="Server-Sent Events: un flujo HTTP que no se cierra"
        subtitle="Una respuesta text/event-stream que va escribiendo eventos con nombre. En la pestaña Red: una sola petición que nunca termina."
        pros="El navegador reconecta solo y reenvía Last-Event-ID: la recuperación viene incluida."
        cons="Es unidireccional. Las acciones del usuario siguen viajando por POST."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void begin()}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
        >
          Importar 5000 filas
        </button>
        <span
          className={`rounded border px-3 py-1.5 font-mono text-xs ${
            state === "abierto"
              ? "border-[var(--success)] text-[var(--success)]"
              : state === "conectando"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          {state}
        </span>
        <span className="font-mono text-xs text-[var(--muted)]">
          reconexiones: {reconnects} · último id: {lastEventId ?? "—"}
        </span>
      </div>

      <TransportStatsPanel
        stats={stats}
        requestsLabel="Conexiones"
        secondaryLabel="Eventos"
        secondary="events"
      />

      <ProgressBar
        pct={latest?.pct ?? 0}
        label={
          latest
            ? `${latest.rows} / ${latest.total} filas · ${latest.stage}`
            : "Sin job en curso"
        }
      />

      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Para la demo</p>
        <p className="mt-1">
          Arranca la importación y, a la mitad, apaga la API
          (<code className="font-mono text-[var(--accent)]">Ctrl-C</code> en{" "}
          <code className="font-mono">@app/api</code>). El estado pasa a
          &laquo;conectando&raquo;. Vuelve a levantarla: el contador de reconexiones
          sube y la barra sigue desde donde iba, porque el navegador reenvió
          <code className="mx-1 font-mono text-[var(--accent)]">Last-Event-ID</code>
          él solo.
        </p>
      </div>

      <EventConsole lines={lines} />
    </div>
  );
}
