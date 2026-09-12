"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EventConsole, { type LogLine } from "../components/event-console";
import MechanismHeader from "../components/mechanism-header";
import ProgressBar from "../components/progress-bar";
import TransportStatsPanel from "../components/transport-stats";
import { fetchJob, startJob, type JobSnapshot } from "@/lib/api";
import { useTransportStats } from "@/lib/use-transport-stats";

const INTERVALS = [1000, 3000, 5000];

export default function PollingPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<JobSnapshot | null>(null);
  const [intervalMs, setIntervalMs] = useState(3000);
  const [lines, setLines] = useState<LogLine[]>([]);
  const { stats, record, reset } = useTransportStats();
  const etagRef = useRef<string | undefined>(undefined);

  const log = useCallback((kind: LogLine["kind"], text: string) => {
    setLines((prev) => [...prev.slice(-80), { at: Date.now(), kind, text }]);
  }, []);

  async function begin() {
    reset();
    setSnapshot(null);
    setLines([]);
    etagRef.current = undefined;
    const job = await startJob();
    setJobId(job.jobId);
    log("info", `job ${job.jobId} arrancado — un tick cada ${job.tickMs} ms`);
  }

  // El mecanismo completo: preguntar cada N milisegundos, pase lo que pase.
  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    async function poll() {
      const result = await fetchJob(jobId!, etagRef.current);
      if (cancelled) return;

      if (result.notModified) {
        // 304: el viaje se hizo y no trajo nada. Esto es el desperdicio.
        record({ requests: 1, wasted: 1 });
        log("warn", "304 Not Modified — viaje sin novedad");
        return;
      }

      etagRef.current = result.etag ?? undefined;
      const snap = result.snapshot!;
      record({
        requests: 1,
        events: 1,
        bytes: result.bytes,
        // La edad del dato al pintarlo: con un intervalo de 3 s esto ronda los
        // 1500 ms de media. Es la "latencia media de medio intervalo".
        lagMs: Date.now() - snap.at,
      });
      setSnapshot(snap);
      log("in", `200 — ${snap.rows} filas (${snap.pct}%)`);
    }

    void poll();
    const timer = setInterval(() => void poll(), intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jobId, intervalMs, record, log]);

  const done = snapshot?.stage === "done";

  return (
    <div className="space-y-6">
      <MechanismHeader
        number="01"
        title="Polling: el cliente pregunta cada N segundos"
        subtitle="Un endpoint REST normal, con ETag. Lo que se mide no es si funciona, sino cuántos viajes cuesta."
        pros="Cacheable, depurable, sin conexión persistente que mantener."
        cons="Latencia media de medio intervalo y peticiones que casi siempre devuelven lo mismo."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void begin()}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
        >
          Importar 5000 filas
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--muted)]">Intervalo:</span>
          {INTERVALS.map((ms) => (
            <button
              key={ms}
              type="button"
              onClick={() => setIntervalMs(ms)}
              className={`rounded border px-3 py-1.5 transition ${
                intervalMs === ms
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {ms / 1000}s
            </button>
          ))}
        </div>
      </div>

      <TransportStatsPanel stats={stats} secondaryLabel="Respuestas 304" />

      <ProgressBar
        pct={snapshot?.pct ?? 0}
        label={
          snapshot
            ? `${snapshot.rows} / ${snapshot.total} filas · ${snapshot.stage}`
            : "Sin job en curso"
        }
      />

      {done ? (
        <p className="text-sm text-[var(--success)]">
          Terminado. Fíjate en cuántas peticiones hicieron falta y cuántas no
          trajeron nada: con un intervalo de {intervalMs / 1000}s el usuario vio
          el final hasta {intervalMs / 1000}s después de que ocurriera.
        </p>
      ) : null}

      <EventConsole lines={lines} />
    </div>
  );
}
