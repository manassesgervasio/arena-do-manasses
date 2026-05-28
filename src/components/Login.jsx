import { useState } from "react";

export default function Login({ onEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    const mensagemErro = await onEntrar({
      email: email.trim().toLowerCase(),
      senha,
    });

    if (mensagemErro) {
      setErro(mensagemErro);
    }

    setCarregando(false);
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Login">
        <div className="login-brand">
          <h1>Arena do Manasses</h1>
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="login-field">
            <span>Senha</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </label>

          {erro && <p className="login-error">{erro}</p>}

          <button className="login-button" type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
