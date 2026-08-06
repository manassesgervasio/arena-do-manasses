export default function CameraCard({
  camera,
  isProcessing = false,
  feedback,
  onSalvarLance,
}) {
  const statusClass = camera.status === "Online" ? "is-online" : "is-offline";

  return (
    <article className="arenacam-camera-card">
      <div className="arenacam-camera-header">
        <div>
          <span className="arenacam-card-kicker">ArenaCam</span>
          <h2>{camera.nome}</h2>
        </div>
        <span className={`arenacam-status ${statusClass}`}>
          {camera.status}
        </span>
      </div>

      <div className="arenacam-preview" aria-label={`Preview ${camera.nome}`}>
        <div className="arenacam-preview-frame">
          <span>{camera.nome}</span>
          <strong>Preview</strong>
        </div>
      </div>

      <button
        type="button"
        className="arenacam-save-button"
        onClick={() => onSalvarLance(camera.id)}
        disabled={isProcessing || camera.status !== "Online"}
      >
        {isProcessing ? "Salvando lance..." : "Salvar lance"}
      </button>

      {feedback?.mensagem && (
        <p className={`arenacam-feedback is-${feedback.tipo}`}>
          {feedback.mensagem}
        </p>
      )}
    </article>
  );
}
