import { Navbar } from "../components/ds/Navbar";
import { Catedraticos } from "../components/sections/Catedraticos";
import { Extracurriculares } from "../components/sections/Extracurriculares";
import { Footer } from "../components/sections/Footer";
import { Hero } from "../components/sections/Hero";
import { InfoPractica } from "../components/sections/InfoPractica";
import { MisionVision } from "../components/sections/MisionVision";
import { Niveles } from "../components/sections/Niveles";
import { Noticias } from "../components/sections/Noticias";
import { Testimonios } from "../components/sections/Testimonios";
import { Ubicacion } from "../components/sections/Ubicacion";

const NAV_ITEMS = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Niveles", href: "#niveles" },
  { label: "Actividades", href: "#actividades" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "Noticias", href: "#noticias" },
  { label: "Ubicación", href: "#ubicacion" },
];

export default function Home() {
  return (
    <div>
      <Navbar
        items={NAV_ITEMS}
        ctaLabel="Inscríbete"
        ctaTargetId="inscripciones"
      />
      <Hero />
      <MisionVision />
      <Niveles />
      <Extracurriculares />
      <Catedraticos />
      <Testimonios />
      <Noticias />
      <InfoPractica />
      <Ubicacion />
      <Footer />
    </div>
  );
}
