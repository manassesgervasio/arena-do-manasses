import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { canAccessConfiguracoesArena } from "../utils/permissoes";
import { Button, Card, Input } from "./ui";

const ARENABASE_PUBLIC_BASE_URL = "https://arenabase.com.br";

function criarFormulario(arena) {
  return {
    nome: arena?.nome || "",
    telefone: arena?.telefone || "",
    cidade: arena?.cidade || "",
    estado: arena?.estado || "",
    slug: arena?.slug || "",
  };
}

function normalizarWhatsapp(valor) {
  return String(valor || "").replace(/[^\d+]/g, "");
}

export default function ConfiguracoesArena({ contextoArena, onVoltar }) {
  const {
    arenaAtual,
    usuarioAtual,
    perfilAtual,
    carregandoContexto,
    erroContexto,
    atualizarArenaAtual,
  } = contextoArena || {};
  const arenaAtualId = arenaAtual?.id;
  const podeAcessar = canAccessConfiguracoesArena(usuarioAtual, perfilAtual);
  const [formulario, setFormulario] = useState(() => criarFormulario(arenaAtual));
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const linkPublico = useMemo(() => {
    if (!formulario.slug) return "";

    return `${ARENABASE_PUBLIC_BASE_URL}/${formulario.slug}`;
  }, [formulario.slug]);

  useEffect(() => {
    setFormulario(criarFormulario(arenaAtual));
    setMensagem("");
    setErro("");
  }, [arenaAtual]);

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function copiarLinkPublico() {
    if (!linkPublico) return;

    try {
      await navigator.clipboard.writeText(linkPublico);
      setMensagem("Link público copiado.");
      setErro("");
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione e copie o link manualmente.");
      setMensagem("");
    }
  }

  async function salvarConfiguracoes(event) {
    event.preventDefault();

    if (!podeAcessar) {
      setErro("Você não tem permissão para acessar esta área.");
      return;
    }

    if (!arenaAtualId) {
      setErro(erroContexto || "Não foi possível carregar os dados da arena.");
      return;
    }

    const nome = formulario.nome.trim();
    const telefone = normalizarWhatsapp(formulario.telefone);

    if (!nome) {
      setErro("Informe o nome da arena.");
      return;
    }

    if (!telefone) {
      setErro("Informe o telefone/WhatsApp da arena.");
      return;
    }

    setSalvando(true);
    setMensagem("");
    setErro("");

    const payload = {
      nome,
      telefone,
      cidade: formulario.cidade.trim() || null,
      estado: formulario.estado.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("arenas")
      .update(payload)
      .eq("id", arenaAtualId)
      .select("id,nome,slug,telefone,cidade,estado,ativa")
      .single();

    setSalvando(false);

    if (error) {
      setErro("Não foi possível salvar as configurações. Tente novamente.");
      return;
    }

    atualizarArenaAtual?.(data);
    setFormulario(criarFormulario(data));
    setMensagem("Configurações salvas com sucesso.");
  }

  if (!podeAcessar) {
    return (
      <section className="configuracoes-arena">
        <div className="configuracoes-arena-header">
          <div>
            <h2>Configurações da Arena</h2>
            <p>Você não tem permissão para acessar esta área.</p>
          </div>
          <Button type="button" onClick={onVoltar}>
            Voltar
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="configuracoes-arena">
      <div className="configuracoes-arena-header">
        <div>
          <h2>Configurações da Arena</h2>
          <p>Atualize as informações básicas exibidas para sua operação.</p>
        </div>
        <Button type="button" onClick={onVoltar}>
          Voltar
        </Button>
      </div>

      {carregandoContexto ? (
        <Card className="configuracoes-arena-card">
          <p>Carregando dados da arena...</p>
        </Card>
      ) : (
        <div className="configuracoes-arena-layout">
          <Card className="configuracoes-arena-card">
            <form className="configuracoes-arena-form" onSubmit={salvarConfiguracoes}>
              <label>
                <span>Nome da arena</span>
                <Input
                  value={formulario.nome}
                  onChange={(event) => atualizarCampo("nome", event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Telefone/WhatsApp</span>
                <Input
                  value={formulario.telefone}
                  onChange={(event) =>
                    atualizarCampo("telefone", event.target.value)
                  }
                  inputMode="tel"
                  required
                />
              </label>

              <div className="configuracoes-arena-grid">
                <label>
                  <span>Cidade</span>
                  <Input
                    value={formulario.cidade}
                    onChange={(event) =>
                      atualizarCampo("cidade", event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Estado</span>
                  <Input
                    value={formulario.estado}
                    onChange={(event) =>
                      atualizarCampo("estado", event.target.value)
                    }
                    maxLength={2}
                  />
                </label>
              </div>

              <label>
                <span>Slug/link público</span>
                <Input value={formulario.slug} readOnly />
              </label>

              {mensagem && (
                <div className="configuracoes-arena-success">{mensagem}</div>
              )}
              {erro && <div className="configuracoes-arena-error">{erro}</div>}

              <Button type="submit" variant="primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar configurações"}
              </Button>
            </form>
          </Card>

          <Card className="configuracoes-arena-public-card">
            <span>Sua agenda pública</span>
            <strong>{linkPublico || "Link indisponível"}</strong>
            <Button
              type="button"
              variant="primary"
              onClick={copiarLinkPublico}
              disabled={!linkPublico}
            >
              Copiar link público
            </Button>
          </Card>
        </div>
      )}
    </section>
  );
}
