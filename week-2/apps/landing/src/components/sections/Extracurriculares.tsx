import { Card } from "../ds/Card";
import { ImageSlot } from "../ds/ImageSlot";

const ACT = [
  {
    nombre: "Robótica",
    desc: "Talleres de programación y construcción de robots, del nivel primario en adelante.",
    id: "act-robotica",
  },
  {
    nombre: "Deportes",
    desc: "Fútbol, baloncesto, natación y atletismo, con competencias interescolares.",
    id: "act-deportes",
  },
  {
    nombre: "Olimpiadas de Ciencias",
    desc: "Preparación y participación en olimpiadas de matemática, física y biología.",
    id: "act-ciencias",
  },
  {
    nombre: "Inglés",
    desc: "Programa de inglés intensivo integrado al pénsum desde preprimaria.",
    id: "act-ingles",
  },
];

export function Extracurriculares() {
  return (
    <section
      id="actividades"
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
          Vida estudiantil
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
          Actividades extracurriculares
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {ACT.map((a) => (
          <Card key={a.id} padding="0" style={{ overflow: "hidden" }}>
            <div style={{ padding: 16, paddingBottom: 0 }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  position: "relative",
                }}
              >
                <ImageSlot
                  shape="circle"
                  placeholder={a.nombre}
                  style={{ border: "4px solid var(--gold-500)" }}
                />
              </div>
            </div>
            <div style={{ padding: "20px 20px 24px", textAlign: "center" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 19,
                  fontWeight: 700,
                  color: "var(--text-heading)",
                  margin: "0 0 8px",
                }}
              >
                {a.nombre}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                {a.desc}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
