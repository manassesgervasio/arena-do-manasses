import { useState } from "react";
import {
  canAccessPainelSaaS,
  canAccessUsuariosArena,
} from "../utils/permissoes";

export default function AppHeader({
  perfilLogado,
  permissoesLogado,
  contextoArena,
  onAbrirPainelSaaS,
  onAbrirUsuariosArena,
  onSair,
  onEntrar,
  modoPublico = false,
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const {
    arenaAtual,
    usuarioAtual,
    perfilAtual,
    carregandoContexto,
    erroContexto,
  } = contextoArena || {};
  const podeAcessarPainelSaaS = canAccessPainelSaaS(usuarioAtual);
  const podeAcessarUsuariosArena = canAccessUsuariosArena(
    usuarioAtual,
    perfilAtual
  );

  return (
    <header className="app-header">
      <div className="app-brand-block">
        <div className="app-brand">ARENA</div>
      </div>

      <div className="app-account">
        <button
          type="button"
          className="app-account-button"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-expanded={menuAberto}
          aria-label="Abrir painel da conta"
        >
          <span aria-hidden="true">{"\u2699"}</span>
        </button>

        {menuAberto && (
          <div className="app-account-layer">
            <button
              type="button"
              className="app-account-backdrop"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar conta"
            />

          <aside className="app-account-menu">
            <div className="app-account-panel-header">
              <span>Perfil</span>
              <button type="button" onClick={() => setMenuAberto(false)}>
                ×
              </button>
            </div>

            <div className="app-account-info">
              {carregandoContexto ? (
                <span>Carregando arena...</span>
              ) : erroContexto ? (
                <span>{erroContexto}</span>
              ) : modoPublico ? (
                <>
                  {arenaAtual?.nome && <span>Arena: {arenaAtual.nome}</span>}
                  <span>Visitante</span>
                </>
              ) : (
                <>
                  {arenaAtual?.nome && <span>Arena: {arenaAtual.nome}</span>}
                  {usuarioAtual?.nome && <span>Usuário: {usuarioAtual.nome}</span>}
                  {perfilAtual && <span>Perfil: {perfilAtual}</span>}
                  {!usuarioAtual && perfilLogado && (
                    <span>Perfil: {perfilLogado}</span>
                  )}
                </>
              )}
            </div>

            {podeAcessarPainelSaaS && (
              <button type="button" onClick={onAbrirPainelSaaS}>
                Painel SaaS
              </button>
            )}
            {podeAcessarUsuariosArena && (
              <button type="button" onClick={onAbrirUsuariosArena}>
                Usuários
              </button>
            )}
            <button type="button" disabled>
              Configurações
            </button>
            {modoPublico ? (
              <button type="button" onClick={onEntrar}>
                Entrar
              </button>
            ) : (usuarioAtual || (perfilLogado && permissoesLogado)) && (
              <button type="button" className="app-account-danger" onClick={onSair}>
                Sair
              </button>
            )}
          </aside>
          </div>
        )}
      </div>
    </header>
  );
}
