/** Reproduce las láminas "A FAVOR / EN CONTRA" de cada mecanismo. */
export default function MechanismHeader({
  number,
  title,
  subtitle,
  pros,
  cons,
}: {
  number: string;
  title: string;
  subtitle: string;
  pros: string;
  cons: string;
}) {
  return (
    <header className="mb-8">
      <p className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase">
        Mecanismo {number}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-[var(--muted)]">{subtitle}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-[var(--border)] border-l-2 border-l-[var(--success)] bg-[var(--surface)] p-3">
          <dt className="font-mono text-xs tracking-wider text-[var(--success)] uppercase">
            A favor
          </dt>
          <dd className="mt-1 text-sm text-[var(--muted)]">{pros}</dd>
        </div>
        <div className="rounded border border-[var(--border)] border-l-2 border-l-[var(--error)] bg-[var(--surface)] p-3">
          <dt className="font-mono text-xs tracking-wider text-[var(--error)] uppercase">
            En contra
          </dt>
          <dd className="mt-1 text-sm text-[var(--muted)]">{cons}</dd>
        </div>
      </dl>
    </header>
  );
}
