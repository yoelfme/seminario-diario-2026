"use client";

import { useCallback, useEffect, useState } from "react";
import EventConsole, { type LogLine } from "../components/event-console";
import MechanismHeader from "../components/mechanism-header";
import { API_URL, simulateCharge, type ChargeMode, type PaymentRecord } from "@/lib/api";

const MODES: { mode: ChargeMode; label: string; hint: string }[] = [
  { mode: "normal", label: "Simular pago", hint: "una entrega, firma válida" },
  { mode: "duplicate", label: "Entregar dos veces", hint: "el reintento es la norma" },
  { mode: "tamper", label: "Romper la firma", hint: "debe responder 401" },
];

export default function WebhooksPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [lines, setLines] = useState<LogLine[]>([]);

  const log = useCallback((kind: LogLine["kind"], text: string) => {
    setLines((prev) => [...prev.slice(-80), { at: Date.now(), kind, text }]);
  }, []);

  // El navegador no recibe el webhook: lo recibe la API. Esta es la otra mitad
  // del diagrama, el tramo que sí llega al navegador.
  useEffect(() => {
    const source = new EventSource(`${API_URL}/payments/stream`);

    source.addEventListener("payment", (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as PaymentRecord;
      setPayments((prev) => [data, ...prev].slice(0, 20));
      log("in", `SSE — ${data.id} de ${data.customer}`);
    });

    source.addEventListener("error", () => {
      log("warn", "stream de pagos caído — reintentando solo");
    });

    return () => source.close();
  }, [log]);

  async function charge(mode: ChargeMode) {
    log("out", `POST a la pasarela (${mode})`);
    try {
      const result = await simulateCharge(mode);
      for (const delivery of result.deliveries) {
        const tag =
          delivery.status === 401
            ? "401 firma inválida — la API no lo procesó"
            : delivery.body?.duplicate
              ? "202 duplicate: true — descartado por idempotencia"
              : "202 recibido";
        log(delivery.status === 401 ? "warn" : "info", `${result.event.id} → ${tag}`);
      }
    } catch (error) {
      log("warn", `la pasarela no respondió: ${(error as Error).message}`);
    }
  }

  return (
    <div className="space-y-6">
      <MechanismHeader
        number="03"
        title="Webhooks: notificación entre servidores"
        subtitle="La pasarela hace POST a una URL nuestra. El navegador nunca lo recibe directo."
        pros="Latencia del proveedor, costo nulo en el cliente: nadie pregunta por nada."
        cons="Hay que verificar la firma, responder 2xx rápido y asumir entregas duplicadas."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs">
          <span className="text-[var(--muted)]">Pasarela :3002</span>
          <span className="text-[var(--accent)]">── POST firmado ──▶</span>
          <span className="text-[var(--text)]">Nuestra API :3001</span>
          <span className="text-[var(--accent)]">── SSE ──▶</span>
          <span className="text-[var(--muted)]">Este navegador</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            onClick={() => void charge(m.mode)}
            className="rounded border border-[var(--border)] px-4 py-2 text-left text-sm transition hover:border-[var(--accent)]"
          >
            <span className="block font-medium">{m.label}</span>
            <span className="block text-xs text-[var(--muted)]">{m.hint}</span>
          </button>
        ))}
      </div>

      <section>
        <h2 className="mb-2 font-mono text-sm tracking-wider text-[var(--muted)] uppercase">
          Pagos procesados
        </h2>
        {payments.length === 0 ? (
          <p className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
            Todavía nada. Pulsa &laquo;Simular pago&raquo;.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded border border-[var(--border)] bg-[var(--surface)]">
            {payments.map((payment) => (
              <li
                key={`${payment.id}-${payment.receivedAt}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs text-[var(--muted)]">{payment.id}</span>
                <span>{payment.customer}</span>
                <span className="font-mono text-[var(--success)]">
                  {payment.currency} {(payment.amount / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Qué mirar en la pestaña Red</p>
        <p className="mt-1">
          No hay ningún <code className="font-mono">POST /webhooks/...</code> en esta
          pestaña. El único tráfico entrante es el stream de pagos. El webhook ocurrió
          entre dos servidores y nosotros solo vemos su consecuencia.
        </p>
        <p className="mt-2">
          &laquo;Entregar dos veces&raquo; manda el mismo{" "}
          <code className="font-mono">id</code> dos veces: las dos entregas reciben 202,
          pero solo aparece una fila.
        </p>
      </div>

      <EventConsole lines={lines} />
    </div>
  );
}
