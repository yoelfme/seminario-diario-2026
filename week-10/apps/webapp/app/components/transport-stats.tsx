"use client";

import type { TransportStats } from "@/lib/use-transport-stats";

const CELL = "rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2";

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={CELL}>
      <div className="font-mono text-xs tracking-wider text-[var(--muted)] uppercase">
        {label}
      </div>
      <div className="font-mono text-lg text-[var(--text)]">{value}</div>
      {hint ? <div className="text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

export default function TransportStatsPanel({
  stats,
  requestsLabel = "Peticiones",
  secondaryLabel = "Sin novedad",
  /** El polling mide desperdicio; SSE y long polling miden eventos entregados. */
  secondary = "wasted",
}: {
  stats: TransportStats;
  requestsLabel?: string;
  secondaryLabel?: string;
  secondary?: "wasted" | "events";
}) {
  const wastedPct =
    stats.requests > 0 ? Math.round((stats.wasted / stats.requests) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Cell label={requestsLabel} value={String(stats.requests)} />
      <Cell
        label={secondaryLabel}
        value={String(secondary === "wasted" ? stats.wasted : stats.events)}
        hint={
          secondary === "wasted" && stats.requests > 0
            ? `${wastedPct}% del total`
            : undefined
        }
      />
      <Cell label="Recibido" value={formatBytes(stats.bytes)} />
      <Cell
        label="Retraso"
        value={stats.lagMs === null ? "—" : `${stats.lagMs} ms`}
        hint={`${stats.open} conexión(es) abierta(s)`}
      />
    </div>
  );
}
