export default function AppHeader({ perfilLogado, permissoesLogado, onSair }) {
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
