"use client";

import { useEffect, useRef } from "react";

export type LogLine = { at: number; kind: "in" | "out" | "warn" | "info"; text: string };

const COLOR: Record<LogLine["kind"], string> = {
  in: "text-[var(--success)]",
  out: "text-[var(--accent)]",
  warn: "text-[var(--error)]",
  info: "text-[var(--muted)]",
};

const PREFIX: Record<LogLine["kind"], string> = {
  in: "←",
  out: "→",
  warn: "!",
  info: "·",
};

/**
 * El log va en la página, no en la consola del navegador: en clase se proyecta
 * la pestaña, no las devtools.
 */
export default function EventConsole({ lines }: { lines: LogLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  return (
    <div className="h-56 overflow-y-auto rounded border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs leading-relaxed">
      {lines.length === 0 ? (
        <p className="text-[var(--muted)]">Sin actividad todavía.</p>
      ) : (
        lines.map((line, index) => (
          <div key={index} className={COLOR[line.kind]}>
            <span className="text-[var(--muted)]">
              {new Date(line.at).toLocaleTimeString("es-GT", { hour12: false })}{" "}
            </span>
            {PREFIX[line.kind]} {line.text}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
