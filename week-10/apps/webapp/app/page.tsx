import Link from "next/link";

const MECHANISMS = [
  {
    href: "/polling",
    number: "01",
    name: "Polling",
    direction: "Cliente pregunta",
    latency: "Medio intervalo",
    cost: "Bajo, pero repetido",
    when: "Segundos de retraso son aceptables",
  },
  {
    href: "/long-polling",
    number: "02",
    name: "Long polling",
    direction: "Cliente espera",
    latency: "Casi inmediata",
    cost: "Una petición retenida",
    when: "Fallback donde SSE no pasa",
  },
  {
    href: "/webhooks",
    number: "03",
    name: "Webhooks",
    direction: "Servidor → servidor",
    latency: "Del proveedor",
    cost: "Nulo en el cliente",
    when: "El evento nace en un tercero",
  },
  {
    href: "/sse",
    number: "04",
    name: "Server-Sent Events",
    direction: "Servidor → cliente",
    latency: "Inmediata",
    cost: "Un stream HTTP",
    when: "Progreso, feeds, notificaciones",
  },
  {
    href: "/websockets",
    number: "05",
    name: "WebSockets",
    direction: "Bidireccional",
    latency: "Inmediata, simétrica",
    cost: "Un socket con estado",
    when: "El cliente también escribe seguido",
  },
];

const QUESTIONS = [
  {
    number: "01",
    question: "¿El cliente necesita escribir seguido?",
    answer: "Sí → WebSocket. No → SSE, y las acciones por REST.",
  },
  {
    number: "02",
    question: "¿Cuánto retraso tolera el usuario?",
    answer: "Si tolera cinco segundos, polling es la respuesta honesta.",
  },
  {
    number: "03",
    question: "¿Qué pasa si el cliente se desconecta 30 s?",
    answer: "Si debe recuperar lo perdido, necesitas ids de evento y un buffer.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section>
        <p className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase">
          Seminario de Tecnologías de Información
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Aplicaciones web en tiempo real
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Cinco mecanismos de transporte y una sola pregunta:{" "}
          <strong className="text-[var(--text)]">
            ¿quién empuja el dato y cada cuánto?
          </strong>{" "}
          Cada demo mide lo que cuesta, no solo lo que logra.
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-sm tracking-wider text-[var(--muted)] uppercase">
          Tabla comparativa
        </h2>
        <div className="overflow-x-auto rounded border border-[var(--border)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--surface)] font-mono text-xs tracking-wider text-[var(--muted)] uppercase">
              <tr>
                <th className="px-4 py-3">Mecanismo</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Latencia</th>
                <th className="px-4 py-3">Costo por cliente</th>
                <th className="px-4 py-3">Usar cuando</th>
              </tr>
            </thead>
            <tbody>
              {MECHANISMS.map((m) => (
                <tr key={m.href} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <Link href={m.href} className="text-[var(--accent)] hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{m.direction}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{m.latency}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{m.cost}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{m.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-sm tracking-wider text-[var(--muted)] uppercase">
          Los cinco demos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MECHANISMS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"
            >
              <span className="font-mono text-xs text-[var(--muted)]">{m.number}</span>
              <h3 className="mt-1 font-medium">{m.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{m.when}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-mono text-sm tracking-wider text-[var(--muted)] uppercase">
          Tres preguntas antes de abrir un socket
        </h2>
        <dl className="divide-y divide-[var(--border)] rounded border border-[var(--border)] bg-[var(--surface)]">
          {QUESTIONS.map((q) => (
            <div key={q.number} className="flex gap-4 p-4">
              <dt className="font-mono text-sm text-[var(--accent)]">{q.number}</dt>
              <dd>
                <p className="font-medium">{q.question}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{q.answer}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
