import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { canAccessConfiguracoesArena } from "../utils/permissoes";
import { Button, Card } from "./ui";

const ARENABASE_PUBLIC_BASE_URL = "https://arenabase.com.br";

function normalizarTelefone(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function criarChaveLinkCopiado(arenaId) {
  return `arenabase:onboarding:${arenaId}:link-publico-copiado`;
}

export default function PrimeirosPassos({ contextoArena, refreshKey }) {
  const { arenaAtual, usuarioAtual, perfilAtual } = contextoArena || {};
  const arenaAtualId = arenaAtual?.id;
  const podeVer = canAccessConfiguracoesArena(usuarioAtual, perfilAtual);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [metricas, setMetricas] = useState({
    reservas: 0,
    mensalistas: 0,
    usuariosExtras: 0,
  });
  const [linkCopiado, setLinkCopiado] = useState(false);

  const linkPublico = useMemo(() => {
    if (!arenaAtual?.slug) return "";

    return `${ARENABASE_PUBLIC_BASE_URL}/${arenaAtual.slug}`;
  }, [arenaAtual?.slug]);

  useEffect(() => {
    if (!arenaAtualId || !podeVer) return;

    setLinkCopiado(localStorage.getItem(criarChaveLinkCopiado(arenaAtualId)) === "1");
  }, [arenaAtualId, podeVer]);

  useEffect(() => {
    if (!arenaAtualId || !podeVer) return;

    let ativo = true;

    async function carregarMetricas() {
      setCarregando(true);
      setErro("");

      const [
        { count: reservasCount, error: reservasError },
        { count: mensalistasCount, error: mensalistasError },
        { count: usuariosCount, error: usuariosError },
      ] = await Promise.all([
        supabase
          .from("reservas")
          .select("id", { count: "exact", head: true })
          .eq("arena_id", arenaAtualId),
        supabase
          .from("mensalistas")
          .select("id", { count: "exact", head: true })
          .eq("arena_id", arenaAtualId),
        supabase
          .from("usuarios_arenas")
          .select("id", { count: "exact", head: true })
          .eq("arena_id", arenaAtualId)
          .eq("ativo", true)
          .neq("usuario_id", usuarioAtual?.id || ""),
      ]);

      if (!ativo) return;

      if (reservasError || mensalistasError || usuariosError) {
        setErro("N\u00e3o foi poss\u00edvel atualizar os primeiros passos agora.");
        setCarregando(false);
        return;
      }

      setMetricas({
        reservas: reservasCount || 0,
        mensalistas: mensalistasCount || 0,
        usuariosExtras: usuariosCount || 0,
      });
      setCarregando(false);
    }

    carregarMetricas();

    return () => {
      ativo = false;
    };
  }, [arenaAtualId, podeVer, refreshKey, usuarioAtual?.id]);

  if (!podeVer || !arenaAtualId) return null;

  async function copiarLinkPublico() {
    if (!linkPublico) return;

    try {
      await navigator.clipboard.writeText(linkPublico);
      localStorage.setItem(criarChaveLinkCopiado(arenaAtualId), "1");
      setLinkCopiado(true);
      setErro("");
    } catch {
      setErro("N\u00e3o foi poss\u00edvel copiar automaticamente. Copie o link manualmente.");
    }
  }

  const itens = [
    {
      id: "whatsapp",
      label: "Configurar WhatsApp da Arena",
      concluido: normalizarTelefone(arenaAtual?.telefone).length >= 10,
    },
    {
      id: "link",
      label: "Copiar Link P\u00fablico da Agenda",
      concluido: linkCopiado,
      acao: copiarLinkPublico,
    },
    {
      id: "reserva",
      label: "Criar Primeira Reserva",
      concluido: metricas.reservas > 0,
    },
    {
      id: "mensalista",
      label: "Cadastrar Primeiro Mensalista",
      concluido: metricas.mensalistas > 0,
    },
    {
      id: "usuario",
      label: "Adicionar Primeiro Usu\u00e1rio",
      concluido: metricas.usuariosExtras > 0,
    },
  ];
  const concluidos = itens.filter((item) => item.concluido).length;
  const completo = concluidos === itens.length;

  return (
    <Card className="primeiros-passos-card">
      <div className="primeiros-passos-header">
        <div>
          <span>Primeiros Passos</span>
          <h2>{concluidos}/5</h2>
        </div>
        <div
          className="primeiros-passos-progress"
          aria-label={`${concluidos} de 5 passos conclu\u00eddos`}
        >
          <span style={{ width: `${(concluidos / itens.length) * 100}%` }} />
        </div>
      </div>

      {completo ? (
        <div className="primeiros-passos-success">
          <strong>{"\u{1F389} ArenaBase configurada com sucesso!"}</strong>
          <p>Sua arena est\u00e1 pronta para receber reservas.</p>
        </div>
      ) : (
        <div className="primeiros-passos-list">
          {itens.map((item) => (
            <div
              className={`primeiros-passos-item${
                item.concluido ? " is-done" : ""
              }`}
              key={item.id}
            >
              <span className="primeiros-passos-check">
                {item.concluido ? "\u2713" : ""}
              </span>
              <span>{item.label}</span>
              {item.acao && !item.concluido && (
                <Button type="button" onClick={item.acao}>
                  Copiar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {linkPublico && !completo && (
        <div className="primeiros-passos-link">{linkPublico}</div>
      )}
      {carregando && <p className="primeiros-passos-muted">Atualizando...</p>}
      {erro && <p className="primeiros-passos-error">{erro}</p>}
    </Card>
  );
}
