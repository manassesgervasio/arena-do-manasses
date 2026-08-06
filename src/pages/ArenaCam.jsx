import { useMemo, useState } from "react";
import CameraCard from "../components/arenacam/CameraCard";
import LancesRecentes from "../components/arenacam/LancesRecentes";
import {
  calcularExpiresAt,
  filtrarLancesDisponiveis,
  gerarLance,
} from "../services/arenacamService";

const CAMERAS = [
  {
    id: "camera-1",
    nome: "Câmera 1",
    status: "Online",
  },
  {
    id: "camera-2",
    nome: "Câmera 2",
    status: "Online",
  },
];

export default function ArenaCam({ contextoArena }) {
  const arenaId = contextoArena?.arenaAtual?.id || "";
  const [cameraProcessando, setCameraProcessando] = useState("");
  const [feedbackPorCamera, setFeedbackPorCamera] = useState({});
  const [lances, setLances] = useState(() => criarLancesMock(arenaId));
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
            onSalvarLance={salvarLance}
          />
        ))}
      </section>

      <LancesRecentes lances={lancesDisponiveis} />
    </main>
  );
}

function criarLancesMock(arenaId) {
  const agora = Date.now();

  return [
    criarLanceMock({
      id: "mock-lance-1",
      camera_id: "camera-1",
      camera_nome: "Câmera 1",
      arena_id: arenaId,
      created_at: new Date(agora - 1000 * 60 * 8).toISOString(),
      status: "concluido",
      video_url: "/mock/arenacam/lance-1.mp4",
    }),
    criarLanceMock({
      id: "mock-lance-2",
      camera_id: "camera-2",
      camera_nome: "Câmera 2",
      arena_id: arenaId,
      created_at: new Date(agora - 1000 * 60 * 19).toISOString(),
      status: "concluido",
      video_url: "/mock/arenacam/lance-2.mp4",
    }),
    criarLanceMock({
      id: "mock-lance-expirado",
      camera_id: "camera-1",
      camera_nome: "Câmera 1",
      arena_id: arenaId,
      created_at: new Date(agora - 1000 * 60 * 60 * 80).toISOString(),
      status: "expirado",
      video_url: "/mock/arenacam/lance-expirado.mp4",
    }),
  ];
}

function criarLanceMock(lance) {
  return {
    ...lance,
    expires_at: calcularExpiresAt(lance.created_at),
  };
}
