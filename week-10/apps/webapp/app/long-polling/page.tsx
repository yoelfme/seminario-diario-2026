"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EventConsole, { type LogLine } from "../components/event-console";
import MechanismHeader from "../components/mechanism-header";
import ProgressBar from "../components/progress-bar";
import TransportStatsPanel from "../components/transport-stats";
import { startJob, waitForJob, type JobEvent } from "@/lib/api";
import { useTransportStats } from "@/lib/use-transport-stats";

export default function LongPollingPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [latest, setLatest] = useState<JobEvent | null>(null);
  const [held, setHeld] = useState(false);
  const [heldSince, setHeldSince] = useState<number | null>(null);
  const [lines, setLines] = useState<LogLine[]>([]);
  const { stats, record, reset } = useTransportStats();
  const cursorRef = useRef(0);

  const log = useCallback((kind: LogLine["kind"], text: string) => {
    setLines((prev) => [...prev.slice(-80), { at: Date.now(), kind, text }]);
  }, []);

  async function begin() {
    reset();
    setLatest(null);
    setLines([]);
    cursorRef.current = 0;
    const job = await startJob();
    setJobId(job.jobId);
    log("info", `job ${job.jobId} arrancado`);
  }

  // Un bucle, no un temporizador: en cuanto una petición vuelve, se abre la
  // siguiente. Nunca hay más de una en vuelo.
  useEffect(() => {
    if (!jobId) return;

    const controller = new AbortController();
    let running = true;

    async function loop() {
      while (running) {
        const sentAt = Date.now();
        setHeld(true);
        setHeldSince(sentAt);
        log("out", `GET /wait?cursor=${cursorRef.current} — retenida`);

        try {
          const result = await waitForJob(jobId!, cursorRef.current, controller.signal);
          if (!running) return;
          setHeld(false);

          if (result.kind === "timeout") {
            // 204: no es un error, es el ciclo normal. Se vuelve a preguntar.
            record({ requests: 1, wasted: 1, open: 1 });
            log("warn", `204 tras ${Date.now() - sentAt} ms — reabriendo`);
            continue;
          }

          cursorRef.current = result.cursor;
          const last = result.events[result.events.length - 1]!;
          setLatest(last);
          record({
            requests: 1,
            events: result.events.length,
            bytes: result.bytes,
            open: 1,
            // Edad del dato, no duración de la petición: comparable con las otras páginas.
            lagMs: Date.now() - last.at,
          });
          log(
            "in",
            `200 tras ${Date.now() - sentAt} ms — ${result.events.length} evento(s), ${last.pct}%`,
          );

          if (last.stage === "done") {
            running = false;
            setHeld(false);
            record({ open: 0 });
            log("info", "job terminado — se cierra el bucle");
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          log("warn", `error: ${(error as Error).message}`);
          running = false;
          setHeld(false);
        }
      }
    }

    void loop();
    return () => {
      running = false;
      controller.abort();
    };
  }, [jobId, record, log]);

  return (
    <div className="space-y-6">
      <MechanismHeader
        number="02"
        title="Long polling: la petición espera la novedad"
        subtitle="El servidor retiene la respuesta hasta 25 s. Una sola petición en vuelo a la vez; mira la pestaña Red."
        pros="Latencia casi inmediata sin salir de HTTP. Atraviesa proxies antiguos sin configuración."
        cons="Cada cliente en espera retiene una petición abierta, y hay que reabrirla en cada ciclo."
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
            held
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          {held
            ? `petición retenida desde ${heldSince ? new Date(heldSince).toLocaleTimeString("es-GT", { hour12: false }) : "—"}`
            : "sin petición en vuelo"}
        </span>
      </div>

      <TransportStatsPanel stats={stats} secondaryLabel="Respuestas 204" />

      <ProgressBar
        pct={latest?.pct ?? 0}
        label={
          latest
            ? `${latest.rows} / ${latest.total} filas · ${latest.stage}`
            : "Sin job en curso"
        }
      />

      <p className="text-sm text-[var(--muted)]">
        El cursor es lo que hace esto recuperable: el cliente dice hasta dónde
        llegó y el servidor le da solo el diferencial. Es el mismo mecanismo que
        <code className="mx-1 font-mono text-[var(--accent)]">Last-Event-ID</code>
        en SSE.
      </p>

      <EventConsole lines={lines} />
    </div>
  );
}
