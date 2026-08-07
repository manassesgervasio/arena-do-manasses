import { useEffect, useState } from "react";
import LancesRecentes from "../components/arenacam/LancesRecentes";
import { listarReplaysPublicosDisponiveis } from "../services/arenacamService";

const PUBLIC_REPLAYS_ARENA_SLUG =
  import.meta.env.VITE_ARENACAM_PUBLIC_REPLAYS_ARENA_SLUG ||
  "arena-do-manasses";

export default function ReplaysPublicos() {
  const [lances, setLances] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarReplays() {
      setCarregando(true);
      setErro("");

      try {
        const replays = await listarReplaysPublicosDisponiveis(
          PUBLIC_REPLAYS_ARENA_SLUG
        );

        if (!ativo) return;

        setLances(replays);
      } catch (error) {
        if (!ativo) return;

        setLances([]);
        setErro(
          error?.message || "Nao foi possivel carregar os replays agora."
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarReplays();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className="arenacam-public-page">
      <section className="arenacam-public-header">
        <span className="arenacam-card-kicker">ArenaCam</span>
        <h1>Replays disponíveis</h1>
      </section>

      <LancesRecentes lances={lances} carregando={carregando} erro={erro} />
    </main>
  );
}
