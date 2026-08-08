import { Badge } from "../ds/Badge";
import { Card } from "../ds/Card";

export function InfoPractica() {
  return (
    <section
      id="inscripciones"
      style={{ padding: "80px 8vw", background: "var(--surface-page)" }}
    >
      <div
        style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 48px" }}
      >
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 800,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            fontSize: 13,
            color: "var(--brand-secondary)",
            marginBottom: 10,
          }}
        >
          Información práctica
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            fontWeight: 800,
            color: "var(--text-heading)",
            margin: 0,
          }}
        >
          Horarios e inscripciones
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <Card>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-heading)",
              margin: "0 0 16px",
            }}
          >
            Horarios de atención
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontFamily: "var(--font-body)",
              fontSize: 15,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: 10,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                Clases (lunes a viernes)
              </span>
              <strong style={{ color: "var(--text-heading)" }}>
                7:00 a.m. – 3:00 p.m.
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: 10,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                Oficina administrativa
              </span>
              <strong style={{ color: "var(--text-heading)" }}>
                8:00 a.m. – 5:00 p.m.
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Sábados</span>
              <strong style={{ color: "var(--text-heading)" }}>Cerrado</strong>
            </div>
          </div>
        </Card>
        <Card>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-heading)",
              margin: "0 0 16px",
            }}
          >
            Calendario de inscripciones
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontFamily: "var(--font-body)",
              fontSize: 15,
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Badge kind="gold">Feb</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Apertura de inscripciones ciclo 2027
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Badge kind="green">Mar–Oct</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Visitas guiadas y proceso de admisión
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Badge kind="navy">Ene</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Inicio de clases
              </span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
