const permissoesIniciais = [
  "Agenda",
  "Clientes",
  "Financeiro",
];

export default function LoginPage() {
  function handleSubmit(event) {
    event.preventDefault();
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

          <button className="login-button" type="submit">
            Entrar
          </button>
        </form>

        <div className="login-permissions" aria-label="Permissões">
          {permissoesIniciais.map((permissao) => (
            <span key={permissao}>{permissao}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
