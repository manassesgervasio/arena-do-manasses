import { useMemo } from "react";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export default function LancesRecentes({
  lances = [],
  carregando = false,
  erro = "",
  onExcluirLance,
}) {
  const diasCalendario = useMemo(() => montarDiasCalendario(lances), [lances]);

  function abrirVideo(videoUrl) {
    if (!videoUrl) return;

    window.location.href = videoUrl;
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
      ) : (
        <div className="arenacam-calendar-gallery">
          {diasCalendario.map((dia) => (
            <DiaLances
              key={dia.chave}
              dia={dia}
              onAbrirVideo={abrirVideo}
              onExcluirLance={onExcluirLance}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DiaLances({ dia, onAbrirVideo, onExcluirLance }) {
  return (
    <article
      className={`arenacam-day-group ${
        dia.indice === 0 ? "is-today" : ""
      }`}
    >
      <header className="arenacam-day-header">
        <div className="arenacam-day-date">
          <strong>{dia.numeroDia}</strong>
          <span>{dia.rotulo}</span>
        </div>
        <div className="arenacam-day-info">
          <h3>{dia.diaSemana}</h3>
          <p>{dia.mesAno}</p>
          <small>{formatarQuantidadeLances(dia.lances.length)}</small>
        </div>
      </header>

      {dia.lances.length === 0 ? (
        <div className="arenacam-day-empty">Nenhum lance</div>
      ) : (
        <div className="arenacam-replay-grid">
          {dia.lances.map((lance) => (
            <LanceCard
              key={lance.id}
              lance={lance}
              onAbrirVideo={onAbrirVideo}
              onExcluirLance={onExcluirLance}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function LanceCard({ lance, onAbrirVideo, onExcluirLance }) {
  const temVideo = Boolean(lance.video_url);
  const podeExcluir = typeof onExcluirLance === "function";

  function baixarVideo() {
    if (!lance.video_url) return;

    const separador = lance.video_url.includes("?") ? "&" : "?";
    window.location.href = `${lance.video_url}${separador}download=1`;
  }

  return (
    <article className="arenacam-replay-card">
      <button
        type="button"
        className="arenacam-replay-preview"
        onClick={() => onAbrirVideo(lance.video_url)}
        disabled={!temVideo}
        title={temVideo ? "Abrir vídeo" : "Vídeo indisponível"}
      >
        {lance.thumbnail_url ? (
          <img
            className="arenacam-replay-thumbnail"
            src={lance.thumbnail_url}
            alt=""
            loading="lazy"
          />
        ) : temVideo ? (
          <video
            className="arenacam-replay-thumbnail"
            src={lance.video_url}
            preload="metadata"
            muted
            playsInline
          />
        ) : null}
        <span className="arenacam-replay-play" aria-hidden="true">
          ▶
        </span>
      </button>

      <div className="arenacam-replay-content">
        <div className="arenacam-replay-main">
          <strong>{formatarHorario(lance.created_at)}</strong>
          <span>{formatarCamera(lance.camera_nome || lance.camera_id)}</span>
        </div>
        <span className="arenacam-lance-status">
          {formatarStatus(lance.status)}
        </span>
      </div>

      <div className="arenacam-replay-actions">
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
          disabled={!temVideo}
          title={temVideo ? "Baixar vídeo" : "Vídeo indisponível"}
        >
          Baixar
        </button>
        {podeExcluir && (
          <button
            type="button"
            className="arenacam-replay-delete"
            onClick={() => onExcluirLance(lance)}
          >
            Excluir
          </button>
        )}
      </div>
    </article>
  );
}

function montarDiasCalendario(lances) {
  const hoje = criarInicioDoDia(new Date());
  const dias = ["Hoje", "Ontem", "Anteontem"].map((rotulo, indice) => {
    const data = new Date(hoje.getTime() - indice * UM_DIA_MS);

    return {
      chave: formatarChaveData(data),
      data,
      indice,
      rotulo,
      numeroDia: data.toLocaleDateString("pt-BR", { day: "2-digit" }),
      diaSemana: capitalizar(
        data.toLocaleDateString("pt-BR", { weekday: "long" })
      ),
      mesAno: capitalizar(
        data.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })
      ),
      lances: [],
    };
  });
  const diasPorChave = new Map(dias.map((dia) => [dia.chave, dia]));

  lances.forEach((lance) => {
    const chave = formatarChaveData(lance.created_at);
    const dia = diasPorChave.get(chave);

    if (dia) dia.lances.push(lance);
  });

  dias.forEach((dia) => {
    dia.lances.sort(
      (lanceA, lanceB) =>
        obterTimestamp(lanceA.created_at) - obterTimestamp(lanceB.created_at)
    );
  });

  return dias;
}

function criarInicioDoDia(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function formatarChaveData(dataTexto) {
  const data = dataTexto instanceof Date ? dataTexto : new Date(dataTexto);

  if (Number.isNaN(data.getTime())) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterTimestamp(dataTexto) {
  const data = new Date(dataTexto);

  if (Number.isNaN(data.getTime())) return 0;

  return data.getTime();
}

function formatarHorario(dataTexto) {
  const data = new Date(dataTexto);

  if (Number.isNaN(data.getTime())) return "--:--";

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarQuantidadeLances(quantidade) {
  return quantidade === 1 ? "1 lance" : `${quantidade} lances`;
}

function formatarStatus(status) {
  if (status === "concluido") return "Concluído";
  if (status === "processando") return "Processando";
  if (status === "erro") return "Erro";
  if (status === "expirado") return "Expirado";

  return status || "Pendente";
}

function formatarCamera(camera) {
  if (camera === "camera-1") return "Câmera 1";
  if (camera === "camera-2") return "Câmera 2";

  return camera || "Câmera";
}

function capitalizar(texto) {
  if (!texto) return "";

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
