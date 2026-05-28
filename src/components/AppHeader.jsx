export default function AppHeader({
  perfilLogado,
  permissoesLogado,
  contextoArena,
  onSair,
}) {
  const {
    arenaAtual,
    perfilAtual,
    carregandoContexto,
    erroContexto,
  } = contextoArena || {};

  return (
    <>
      <h1
       className="app-title"
       style={{
    textAlign: "center",
    fontSize: "46px",
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: "1px",
    textShadow: "0 0 18px rgba(34, 197, 94, 0.75)",
    marginBottom: "8px",
        }}
      >
        Arena do Manassés ⚽
      </h1>

      <p
        className="app-subtitle"
        style={{
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        Agenda por datas reais
      </p>

      <div className="arena-context">
        {carregandoContexto ? (
          <span>Carregando arena...</span>
        ) : erroContexto ? (
          <span>{erroContexto}</span>
        ) : arenaAtual && perfilAtual ? (
          <>
            <span>
              Arena: <strong>{arenaAtual.nome}</strong>
            </span>
            <span>
              Perfil: <strong>{perfilAtual}</strong>
            </span>
          </>
        ) : null}
      </div>

      {perfilLogado && permissoesLogado && (
        <div className="logged-profile" aria-label="Perfil logado">
          <span>
            Perfil logado: <strong>{perfilLogado}</strong>
          </span>
          <button type="button" onClick={onSair}>
            Sair
          </button>
        </div>
      )}
    </>
  );
}
