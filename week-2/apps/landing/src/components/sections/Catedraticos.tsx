import { Badge } from "../ds/Badge";
import { Card } from "../ds/Card";
import { ImageSlot } from "../ds/ImageSlot";

const DOCENTES = [
  {
    nombre: "Lcda. Ana Morales",
    rol: "Coordinadora de Preprimaria",
    formacion:
      "Licenciatura en Educación Preescolar, Universidad Rafael Landívar",
    id: "doc-1",
  },
  {
    nombre: "Lic. Carlos Ramírez",
    rol: "Coordinador de Primaria",
    formacion:
      "Licenciatura en Pedagogía, Universidad de San Carlos de Guatemala",
    id: "doc-2",
  },
  {
    nombre: "Msc. Paola Hernández",
    rol: "Coordinadora de Básico y Diversificado",
    formacion:
      "Maestría en Matemática Educativa, Universidad del Valle de Guatemala",
    id: "doc-3",
  },
  {
    nombre: "Lic. Diego Solís",
    rol: "Coordinador de Inglés",
    formacion: "Licenciatura en Lingüística Aplicada, certificación TEFL",
    id: "doc-4",
  },
];

export function Catedraticos() {
  return (
    <section
      id="catedraticos"
      style={{ padding: "80px 8vw", background: "var(--surface-sunken)" }}
    >
      <div
        style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}
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
          Nuestro equipo
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
          Formación académica de nuestros catedráticos
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--text-muted)",
            marginTop: 14,
          }}
        >
          Contamos con un equipo docente titulado y en constante actualización
          profesional.
        </p>
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
        {DOCENTES.map((d) => (
          <Card key={d.id} style={{ textAlign: "center" }}>
            <div style={{ width: 88, height: 88, margin: "0 auto 16px" }}>
              <ImageSlot
                shape="circle"
                placeholder="Foto"
                style={{ border: "3px solid var(--gold-500)" }}
              />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-heading)",
                margin: "0 0 4px",
              }}
            >
              {d.nombre}
            </h3>
            <div style={{ marginBottom: 10 }}>
              <Badge kind="green">{d.rol}</Badge>
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {d.formacion}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
