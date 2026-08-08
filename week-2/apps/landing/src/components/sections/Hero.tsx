"use client";

import { Button } from "../ds/Button";
import { scrollToId } from "../../lib/scroll";

export function Hero() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg,var(--navy-900),var(--navy-800))",
        color: "#fff",
        padding: "90px 8vw 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          border: "6px solid var(--gold-500)",
          opacity: 0.5,
        }}
      />
      <div style={{ maxWidth: 640, position: "relative" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid var(--border-on-dark)",
            borderRadius: "var(--radius-pill)",
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 24,
            fontFamily: "var(--font-body)",
          }}
        >
          Inscripciones ciclo 2027 abiertas
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 56,
            lineHeight: 1.05,
            margin: "0 0 20px",
          }}
        >
          Educación con excelencia, desde preprimaria hasta diversificado.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 19,
            lineHeight: 1.6,
            color: "var(--text-on-dark-muted)",
            margin: "0 0 32px",
            maxWidth: 520,
          }}
        >
          Nuestro objetivo es ofrecer la mejor educación para sus hijos, de los
          2 a los 18 años, con un enfoque integral en lo académico, lo deportivo
          y lo humano.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Button
            variant="gold"
            size="lg"
            onClick={() => scrollToId("inscripciones")}
          >
            Agenda una visita
          </Button>
          <Button
            variant="ghost"
            size="lg"
            style={{ color: "#fff", border: "2px solid rgba(255,255,255,0.4)" }}
            onClick={() => scrollToId("niveles")}
          >
            Conoce los niveles
          </Button>
        </div>
      </div>
    </section>
  );
}
