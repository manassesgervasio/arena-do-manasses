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
            onClick={() => onAbrirVideo(lance.video_url)}
            disabled={!temVideo}
            title={temVideo ? "Baixar vídeo" : "Vídeo indisponível"}
          >
            Baixar
          </button>
        </div>
      </td>
    </tr>
  );
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
