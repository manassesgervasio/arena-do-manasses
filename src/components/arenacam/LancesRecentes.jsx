import { useState } from "react";

export default function LancesRecentes({
  lances = [],
  carregando = false,
  erro = "",
}) {
  function abrirVideo(videoUrl) {
    if (!videoUrl) return;

    window.open(videoUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="arenacam-recent-section">
      <div className="arenacam-section-header">
        <span className="arenacam-card-kicker">Recortes</span>
        <h2>Lances recentes</h2>
      </div>

      {erro ? (
        <div className="arenacam-empty">{erro}</div>
      ) : carregando ? (
        <div className="arenacam-empty">Carregando lances...</div>
      ) : lances.length === 0 ? (
        <div className="arenacam-empty">Nenhum lance disponível ainda.</div>
      ) : (
        <div className="arenacam-table-wrap">
          <table className="arenacam-table">
            <thead>
              <tr>
                <th>Horário</th>
                <th>Câmera</th>
                <th>Status</th>
                <th>Disponível até</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lances.map((lance) => (
                <LinhaLance
                  key={lance.id}
                  lance={lance}
                  onAbrirVideo={abrirVideo}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LinhaLance({ lance, onAbrirVideo }) {
  const temVideo = Boolean(lance.video_url);
  const [baixando, setBaixando] = useState(false);
  const [erroDownload, setErroDownload] = useState("");

  async function baixarVideo() {
    if (!lance.video_url || baixando) return;

    setBaixando(true);
    setErroDownload("");

    try {
      const response = await fetch(lance.video_url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const urlTemporaria = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = urlTemporaria;
      link.download = criarNomeArquivo(lance);
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(urlTemporaria);
      }, 1000);
    } catch (error) {
      console.error("Erro ao baixar video do ArenaCam:", error);
      setErroDownload(
        "Nao foi possivel baixar o video. Tente assistir ou baixar novamente."
      );
    } finally {
      setBaixando(false);
    }
  }

  return (
    <tr>
      <td>{formatarHorario(lance.created_at)}</td>
      <td>{lance.camera_nome || lance.camera_id}</td>
      <td>
        <span className="arenacam-lance-status">
          {formatarStatus(lance.status)}
        </span>
      </td>
      <td>{formatarDataHora(lance.expires_at)}</td>
      <td>
        <div className="arenacam-table-actions">
          <button
            type="button"
            onClick={() => onAbrirVideo(lance.video_url)}
            disabled={!temVideo}
            title={temVideo ? "Abrir vídeo" : "Vídeo indisponível"}
          >
            {temVideo ? "Assistir" : "Vídeo indisponível"}
          </button>
          <button
            type="button"
            onClick={baixarVideo}
            disabled={!temVideo || baixando}
            title={temVideo ? "Baixar vídeo" : "Vídeo indisponível"}
          >
            {baixando ? "Baixando..." : "Baixar"}
          </button>
        </div>
        {erroDownload && (
          <p className="arenacam-download-feedback">{erroDownload}</p>
        )}
      </td>
    </tr>
  );
}

function criarNomeArquivo(lance) {
  const identificador = String(lance.id || lance.created_at || Date.now())
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-");

  return `arenacam-lance-${identificador}.mp4`;
}

function formatarHorario(dataTexto) {
  const data = new Date(dataTexto);

  if (Number.isNaN(data.getTime())) return "--:--";

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDataHora(dataTexto) {
  const data = new Date(dataTexto);

  if (Number.isNaN(data.getTime())) return "--";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarStatus(status) {
  if (status === "concluido") return "Concluído";
  if (status === "processando") return "Processando";
  if (status === "erro") return "Erro";
  if (status === "expirado") return "Expirado";

  return status || "Pendente";
}
