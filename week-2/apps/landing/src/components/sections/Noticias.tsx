import { Badge } from "../ds/Badge";
import { Button } from "../ds/Button";

export function Noticias() {
  return (
    <section
      id="noticias"
      style={{ padding: "80px 8vw", background: "var(--surface-sunken)" }}
    >
      <div
        style={{ maxWidth: 600, margin: "0 auto 48px", textAlign: "center" }}
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
          Comunidad
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
          Noticias y logros
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "var(--navy-800)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
            color: "#fff",
          }}
        >
          <Badge kind="gold">Deportes</Badge>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              margin: "14px 0 8px",
            }}
          >
            Felicitamos a nuestro equipo de natación
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-on-dark-muted)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Medallas de oro y plata en el torneo interescolar de la región.
          </p>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--radius-lg)",
            padding: 28,
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Badge kind="green">Admisiones</Badge>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              margin: "14px 0 8px",
              color: "var(--text-heading)",
            }}
          >
            Inscripciones ciclo 2027 abiertas
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Cupos limitados para todos los niveles. Agenda tu visita hoy.
          </p>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--radius-lg)",
            padding: 28,
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Badge kind="navy">Eventos</Badge>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              margin: "14px 0 8px",
              color: "var(--text-heading)",
            }}
          >
            Feria anual de ciencias
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Estudiantes de primaria, básico y diversificado presentan sus
            proyectos.
          </p>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          Síganos en redes sociales para más noticias y logros de nuestra
          comunidad.
        </p>
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button variant="outline" size="md">
            Facebook
          </Button>
          <Button variant="outline" size="md">
            Instagram
          </Button>
        </div>
      </div>
    </section>
  );
}
