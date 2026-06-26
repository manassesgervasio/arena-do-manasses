import { useEffect } from "react";
import {
  Beneficios,
  ComoFunciona,
  CTAFinal,
  Depoimentos,
  Diferenciais,
  FAQ,
  Footer,
  Funcionalidades,
  Hero,
  Planos,
  Problemas,
  Screenshots,
  TrustBar,
} from "../components/landing";

const LANDING_DESCRIPTION =
  "ArenaBase é o sistema premium para arenas organizarem agenda, reservas, mensalistas, clientes e financeiro em uma plataforma profissional.";

export default function LandingPage({ onEntrar, onBuscarArenas }) {
  useEffect(() => {
    document.title = "ArenaBase | Gestão premium para arenas esportivas";
    atualizarMeta("description", LANDING_DESCRIPTION);
    atualizarMeta("og:title", "ArenaBase | Gestão premium para arenas esportivas", "property");
    atualizarMeta("og:description", LANDING_DESCRIPTION, "property");
    atualizarMeta("og:type", "website", "property");
  }, []);

  return (
    <main className="landing-page">
      <Hero onEntrar={onEntrar} onBuscarArenas={onBuscarArenas} />
      <TrustBar />
      <Problemas />
      <Funcionalidades />
      <Screenshots />
      <Beneficios />
      <ComoFunciona />
      <Diferenciais />
      <Depoimentos />
      <Planos />
      <FAQ />
      <CTAFinal onEntrar={onEntrar} />
      <Footer onEntrar={onEntrar} />
    </main>
  );
}

function atualizarMeta(chave, conteudo, atributo = "name") {
  let meta = document.querySelector(`meta[${atributo}="${chave}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(atributo, chave);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", conteudo);
}
