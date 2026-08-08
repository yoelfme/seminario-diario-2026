export function Ubicacion() {
  return (
    <section
      id="ubicacion"
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
          Visítenos
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
          Ubicación
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--text-muted)",
            marginTop: 14,
          }}
        >
          Guatemala, Guatemala — ajustaremos el mapa a la dirección exacta del
          colegio.
        </p>
      </div>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <iframe
          title="Ubicación Colegio El Bosque"
          src="https://www.google.com/maps?q=Ciudad+de+Guatemala,+Guatemala&output=embed"
          width="100%"
          height="420"
          style={{ border: 0, display: "block" }}
          loading="lazy"
        />
      </div>
    </section>
  );
}
