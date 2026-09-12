export default function ProgressBar({
  pct,
  label,
}: {
  pct: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-sm">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="text-[var(--accent)]">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)]">
        <div
          className="h-full bg-[var(--accent)] transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
