import Image from "next/image";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--navy-900)",
        color: "var(--text-on-dark-muted)",
        padding: "48px 8vw",
        fontFamily: "var(--font-body)",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 32,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image
          src="/logo.png"
          alt="Colegio El Bosque"
          width={44}
          height={44}
          style={{
            height: 44,
            width: "auto",
            background: "#fff",
            borderRadius: "50%",
            padding: 4,
          }}
        />
        <div>
          <div
            style={{
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            Colegio El Bosque
          </div>
          <div style={{ fontSize: 12 }}>
            © 2027 Todos los derechos reservados
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 14,
        }}
      >
        <strong
          style={{
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontSize: 15,
          }}
        >
          Contacto
        </strong>
        <span>Guatemala, Guatemala</span>
        <span>Lunes a viernes, 8:00 a.m. – 5:00 p.m.</span>
      </div>
      <div style={{ display: "flex", gap: 28, fontSize: 14 }}>
        <a
          href="#nosotros"
          style={{ color: "var(--text-on-dark-muted)", textDecoration: "none" }}
        >
          Nosotros
        </a>
        <a
          href="#inscripciones"
          style={{ color: "var(--text-on-dark-muted)", textDecoration: "none" }}
        >
          Admisiones
        </a>
        <a
          href="#noticias"
          style={{ color: "var(--text-on-dark-muted)", textDecoration: "none" }}
        >
          Noticias
        </a>
        <a
          href="#ubicacion"
          style={{ color: "var(--text-on-dark-muted)", textDecoration: "none" }}
        >
          Ubicación
        </a>
      </div>
    </footer>
  );
}
