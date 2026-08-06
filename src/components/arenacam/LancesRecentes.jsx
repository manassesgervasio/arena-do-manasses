export default function LancesRecentes({ lances = [] }) {
  return (
    <section className="arenacam-recent-section">
      <div className="arenacam-section-header">
        <span className="arenacam-card-kicker">Recortes</span>
        <h2>Lances recentes</h2>
      </div>

      {lances.length === 0 ? (
        <div className="arenacam-empty">Nenhum lance salvo ainda.</div>
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
                <tr key={lance.id}>
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
                      <button type="button" disabled={!lance.video_url}>
                        Assistir
                      </button>
                      <button type="button" disabled={!lance.video_url}>
                        Baixar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
