import { Card } from "../ds/Card";

export function MisionVision() {
  return (
    <section
      id="nosotros"
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
          Nosotros
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
          Misión y visión
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <Card style={{ borderTop: "4px solid var(--brand-secondary)" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-heading)",
              margin: "0 0 12px",
            }}
          >
            Misión
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Formar estudiantes íntegros y competentes, brindando una educación
            de excelencia que combine rigor académico, valores humanos y
            desarrollo integral, preparándolos para enfrentar los retos de la
            sociedad guatemalteca y global.
          </p>
        </Card>
        <Card style={{ borderTop: "4px solid var(--gold-500)" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-heading)",
              margin: "0 0 12px",
            }}
          >
            Visión
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Ser reconocidos como una institución educativa líder en Guatemala,
            referente por la calidad de sus egresados, la innovación pedagógica
            y su compromiso con la comunidad.
          </p>
        </Card>
      </div>
    </section>
  );
}
