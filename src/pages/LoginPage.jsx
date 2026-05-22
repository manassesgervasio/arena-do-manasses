import { useState } from "react";

const permissoesIniciais = [
  "Agenda",
  "Clientes",
  "Financeiro",
];

export default function LoginPage({ onEntrar, perfisPermissoes }) {
  const [perfilSelecionado, setPerfilSelecionado] = useState("Administrador");
  const permissoesPerfil = perfisPermissoes[perfilSelecionado];

  function handleSubmit(event) {
    event.preventDefault();
    onEntrar(perfilSelecionado);
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Login">
        <div className="login-brand">
          <h1>Arena do Manassés</h1>
          <p>Acesso ao sistema</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>E-mail</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="seu@email.com"
            />
          </label>

          <label className="login-field">
            <span>Senha</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
            />
          </label>

          <label className="login-field">
            <span>Perfil</span>
            <select
              name="perfil"
              value={perfilSelecionado}
              onChange={(event) => setPerfilSelecionado(event.target.value)}
            >
              {Object.keys(perfisPermissoes).map((perfil) => (
                <option key={perfil} value={perfil}>
                  {perfil}
                </option>
              ))}
            </select>
          </label>

          <button className="login-button" type="submit">
            Entrar
          </button>
        </form>

        <div className="login-permissions" aria-label="Permissões">
          {permissoesIniciais.map((permissao) => (
            <span key={permissao}>{permissao}</span>
          ))}
          <span>
            {permissoesPerfil.podeLimparPago
              ? "Pode limpar pago"
              : "Não pode limpar pago"}
          </span>
          <span>
            {permissoesPerfil.podeEditarTudo
              ? "Pode editar tudo"
              : "Edição limitada"}
          </span>
        </div>
      </section>
    </main>
  );
}
