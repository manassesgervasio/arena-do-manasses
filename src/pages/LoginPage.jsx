import { useState } from "react";
import { Badge, Button, Card, Input } from "../components/ui";

const permissoesIniciais = [
  "Agenda",
  "Clientes",
  "Financeiro",
];

export default function LoginPage({ onEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    const mensagemErro = await onEntrar({ email, senha });

    if (mensagemErro) {
      setErro(mensagemErro);
    }

    setCarregando(false);
  }

  return (
    <main className="login-page">
      <Card as="section" className="login-panel" aria-label="Login">
        <div className="login-brand">
          <h1>Arena do Manassés</h1>
          <p>Acesso ao sistema</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>E-mail</span>
            <Input
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
            <Input
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

          <Button
            className="login-button"
            type="submit"
            variant="primary"
            disabled={carregando}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="login-permissions" aria-label="Permissões">
          {permissoesIniciais.map((permissao) => (
            <Badge key={permissao} tone="info">
              {permissao}
            </Badge>
          ))}
        </div>
      </Card>
    </main>
  );
}
