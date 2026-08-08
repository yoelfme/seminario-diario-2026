import { Card } from "../ds/Card";
import { ImageSlot } from "../ds/ImageSlot";

const TESTIMONIOS = [
  {
    nombre: "María José Pineda",
    promo: "Generación 2019",
    cita: "El Bosque me dio bases académicas muy sólidas; hoy estudio ingeniería y siento que llegué mejor preparada que muchos de mis compañeros.",
    id: "test-1",
  },
  {
    nombre: "Andrés Contreras",
    promo: "Generación 2021",
    cita: "Más allá de lo académico, aprendí disciplina y trabajo en equipo gracias a los deportes y las olimpiadas de ciencias.",
    id: "test-2",
  },
  {
    nombre: "Fernanda López",
    promo: "Generación 2023",
    cita: "El programa de inglés fue clave para obtener mi beca universitaria. Siempre voy a estar agradecida con mis maestros.",
    id: "test-3",
  },
];

export function Testimonios() {
  return (
    <section
      id="testimonios"
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
          Nuestros egresados
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
          Testimonios de ex-alumnos
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {TESTIMONIOS.map((t) => (
          <Card key={t.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ width: 56, height: 56, flex: "none" }}>
                <ImageSlot shape="circle" placeholder="Foto" />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--text-heading)",
                  }}
                >
                  {t.nombre}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  {t.promo}
                </div>
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                lineHeight: 1.65,
                color: "var(--text-body)",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              &ldquo;{t.cita}&rdquo;
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
