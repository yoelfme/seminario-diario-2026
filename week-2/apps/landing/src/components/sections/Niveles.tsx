import { Badge } from "../ds/Badge";
import { Card } from "../ds/Card";

const NIVELES = [
  {
    nombre: "Preprimario",
    edad: "2 a 5 años",
    color: "var(--gold-500)",
    txt: "var(--navy-900)",
    icono: "🧸",
  },
  {
    nombre: "Primario",
    edad: "7 a 12 años",
    color: "var(--green-700)",
    txt: "#fff",
    icono: "📚",
  },
  {
    nombre: "Básico",
    edad: "12 a 15 años",
    color: "var(--navy-700)",
    txt: "#fff",
    icono: "🔬",
  },
  {
    nombre: "Diversificado",
    edad: "15 a 18 años",
    color: "var(--navy-900)",
    txt: "#fff",
    icono: "🎓",
  },
];

export function Niveles() {
  return (
    <section
      id="niveles"
      style={{ padding: "80px 8vw", background: "var(--surface-sunken)" }}
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
          Nuestros niveles
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
          Un camino educativo completo
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--text-muted)",
            marginTop: 14,
          }}
        >
          Alineado al sistema educativo de Guatemala.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {NIVELES.map((n) => (
          <Card key={n.nombre} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: n.color,
                color: n.txt,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 18px",
              }}
            >
              {n.icono}
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-heading)",
                margin: "0 0 8px",
              }}
            >
              {n.nombre}
            </h3>
            <Badge kind="navy">{n.edad}</Badge>
          </Card>
        ))}
      </div>
    </section>
  );
}
