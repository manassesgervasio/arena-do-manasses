import { useEffect, useMemo, useState } from "react";
import CameraCard from "../components/arenacam/CameraCard";
import LancesRecentes from "../components/arenacam/LancesRecentes";
import {
  excluirLance,
  filtrarLancesDisponiveis,
  gerarLance,
  listarLancesDisponiveis,
} from "../services/arenacamService";

const CAMERAS = [
  {
    id: "camera-1",
    nome: "Câmera 1",
    status: "Online",
    liveUrl: import.meta.env.VITE_ARENACAM_CAMERA1_LIVE_URL,
  },
  {
    id: "camera-2",
    nome: "Câmera 2",
    status: "Online",
    liveUrl: import.meta.env.VITE_ARENACAM_CAMERA2_LIVE_URL,
  },
];

export default function ArenaCam({ contextoArena }) {
  const arenaId = contextoArena?.arenaAtual?.id || "";
  const [cameraProcessando, setCameraProcessando] = useState("");
  const [feedbackPorCamera, setFeedbackPorCamera] = useState({});
  const [lances, setLances] = useState([]);
  const [carregandoLances, setCarregandoLances] = useState(false);
  const [erroLances, setErroLances] = useState("");
  const lancesDisponiveis = useMemo(
    () => filtrarLancesDisponiveis(lances),
    [lances]
  );
  const camerasPorId = useMemo(
    () =>
      CAMERAS.reduce((mapa, camera) => {
        mapa[camera.id] = camera;
        return mapa;
      }, {}),
    []
  );

  useEffect(() => {
    if (!arenaId) {
      setLances([]);
      setErroLances("");
      return;
    }

    let ativo = true;

    async function carregarLances() {
      setCarregandoLances(true);
      setErroLances("");

      try {
        const lancesCarregados = await listarLancesDisponiveis(arenaId);

        if (!ativo) return;

        setLances(lancesCarregados);
      } catch (error) {
        if (!ativo) return;

        setLances([]);
        setErroLances(
          error?.message || "Nao foi possivel carregar os lances do ArenaCam."
        );
      } finally {
        if (ativo) setCarregandoLances(false);
      }
    }

    carregarLances();

    return () => {
      ativo = false;
    };
  }, [arenaId]);

  async function salvarLance(cameraId) {
    const camera = camerasPorId[cameraId];

    setCameraProcessando(cameraId);
    setFeedbackPorCamera((atual) => ({
      ...atual,
      [cameraId]: {
        tipo: "processing",
        mensagem: "Processando recorte do lance...",
      },
    }));

    try {
      const lance = await gerarLance(cameraId, arenaId);
      const lanceComCamera = {
        ...lance,
        camera_nome: camera?.nome || cameraId,
      };

      setLances((atuais) => [lanceComCamera, ...atuais]);
      setFeedbackPorCamera((atual) => ({
        ...atual,
        [cameraId]: {
          tipo: "success",
          mensagem: "Lance salvo com sucesso.",
        },
      }));
    } catch (error) {
      setFeedbackPorCamera((atual) => ({
        ...atual,
        [cameraId]: {
          tipo: "error",
          mensagem:
            error?.message || "Nao foi possivel salvar o lance agora.",
        },
      }));
    } finally {
      setCameraProcessando("");
    }
  }

  async function removerLance(lance) {
    const confirmado = window.confirm(
      "Deseja excluir este replay permanentemente?"
    );

    if (!confirmado) return;

    try {
      await excluirLance(lance.id, arenaId);
      setLances((atuais) => atuais.filter((item) => item.id !== lance.id));
      setErroLances("");
    } catch (error) {
      setErroLances(
        error?.message || "Nao foi possivel excluir o replay agora."
      );
    }
  }

  return (
    <main className="arenacam-page">
      <section className="arenacam-hero">
        <div>
          <span className="arenacam-card-kicker">Controle de vídeo</span>
          <h1>ArenaCam</h1>
          <p>
            Central inicial para registrar recortes de lances das câmeras da
            arena.
          </p>
        </div>
        <div className="arenacam-arena-pill">
          <span>Arena</span>
          <strong>{contextoArena?.arenaAtual?.nome || "ArenaBase"}</strong>
        </div>
      </section>

      <section className="arenacam-grid" aria-label="Câmeras">
        {CAMERAS.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            isProcessing={cameraProcessando === camera.id}
            feedback={feedbackPorCamera[camera.id]}
            liveUrl={camera.liveUrl}
            onSalvarLance={salvarLance}
          />
        ))}
      </section>

      <LancesRecentes
        lances={lancesDisponiveis}
        carregando={carregandoLances}
        erro={erroLances}
        onExcluirLance={removerLance}
      />
    </main>
  );
}
