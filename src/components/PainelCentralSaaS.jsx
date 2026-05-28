import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const statusOpcoes = ["todos", "teste", "ativo", "suspenso", "cancelado"];
const planoOpcoes = ["todos", "teste", "basico", "profissional", "premium"];

function formatarData(dataTexto) {
  if (!dataTexto) return "-";

  const [ano, mes, dia] = dataTexto.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function rotulo(valor) {
  if (!valor) return "-";
  return valor.replace("_", " ");
}

export default function PainelCentralSaaS({ onVoltar }) {
  const [arenas, setArenas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [planoFiltro, setPlanoFiltro] = useState("todos");

  useEffect(() => {
    let ativo = true;

    async function carregarArenas() {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("arenas")
        .select(
          "id,nome,slug,telefone,cidade,estado,ativa,plano,status_assinatura,data_inicio,data_vencimento,observacao_admin,created_at,updated_at"
        )
        .order("created_at", { ascending: false });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar arenas do Painel SaaS:", error);
        setErro(`Nao foi possivel carregar as arenas. ${error.message}`);
        setArenas([]);
        setCarregando(false);
        return;
      }

      setArenas(data || []);
      setCarregando(false);
    }

    carregarArenas();

    return () => {
      ativo = false;
    };
  }, []);

  const resumo = useMemo(() => {
    return arenas.reduce(
      (total, arena) => {
        total.total += 1;
        if (arena.ativa) total.ativas += 1;
        if (arena.status_assinatura === "teste") total.teste += 1;
        if (arena.status_assinatura === "suspenso") total.suspensas += 1;
        if (arena.status_assinatura === "cancelado") total.canceladas += 1;
        return total;
      },
      {
        total: 0,
        ativas: 0,
        teste: 0,
        suspensas: 0,
        canceladas: 0,
      }
    );
  }, [arenas]);

  const arenasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return arenas.filter((arena) => {
      const combinaBusca =
        !buscaNormalizada ||
        normalizarTexto(arena.nome).includes(buscaNormalizada) ||
        normalizarTexto(arena.slug).includes(buscaNormalizada);
      const combinaStatus =
        statusFiltro === "todos" || arena.status_assinatura === statusFiltro;
      const combinaPlano = planoFiltro === "todos" || arena.plano === planoFiltro;

      return combinaBusca && combinaStatus && combinaPlano;
    });
  }, [arenas, busca, planoFiltro, statusFiltro]);

  return (
    <section className="painel-saas">
      <div className="painel-saas-header">
        <div>
          <h2>Painel Central SaaS</h2>
          <p>Administração das arenas cadastradas</p>
        </div>

        <button type="button" onClick={onVoltar}>
          Voltar para Arena
        </button>
      </div>

      <div className="painel-saas-summary">
        <PainelResumoCard titulo="Total de arenas" valor={resumo.total} />
        <PainelResumoCard titulo="Arenas ativas" valor={resumo.ativas} />
        <PainelResumoCard titulo="Arenas em teste" valor={resumo.teste} />
        <PainelResumoCard titulo="Arenas suspensas" valor={resumo.suspensas} />
        <PainelResumoCard titulo="Arenas canceladas" valor={resumo.canceladas} />
      </div>

      <div className="painel-saas-filters">
        <label>
          <span>Buscar por nome da arena</span>
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Nome ou slug"
          />
        </label>

        <label>
          <span>Status da assinatura</span>
          <select
            value={statusFiltro}
            onChange={(event) => setStatusFiltro(event.target.value)}
          >
            {statusOpcoes.map((status) => (
              <option key={status} value={status}>
                {status === "todos" ? "Todos" : rotulo(status)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Plano</span>
          <select
            value={planoFiltro}
            onChange={(event) => setPlanoFiltro(event.target.value)}
          >
            {planoOpcoes.map((plano) => (
              <option key={plano} value={plano}>
                {plano === "todos" ? "Todos" : rotulo(plano)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {carregando && (
        <div className="painel-saas-loading">Carregando arenas...</div>
      )}

      {erro && <div className="painel-saas-error">{erro}</div>}

      {!carregando && !erro && (
        <div className="painel-saas-table-wrap">
          <table className="painel-saas-table">
            <thead>
              <tr>
                <th>Nome da arena</th>
                <th>Slug</th>
                <th>Cidade/Estado</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Ativa</th>
                <th>Data de início</th>
                <th>Data de vencimento</th>
              </tr>
            </thead>
            <tbody>
              {arenasFiltradas.map((arena) => (
                <tr key={arena.id}>
                  <td>
                    <strong>{arena.nome}</strong>
                  </td>
                  <td>{arena.slug}</td>
                  <td>
                    {[arena.cidade, arena.estado].filter(Boolean).join("/") || "-"}
                  </td>
                  <td>
                    <span className="painel-saas-badge">{rotulo(arena.plano)}</span>
                  </td>
                  <td>
                    <span
                      className={`painel-saas-status painel-saas-status-${arena.status_assinatura || "teste"}`}
                    >
                      {rotulo(arena.status_assinatura)}
                    </span>
                  </td>
                  <td>{arena.ativa ? "Sim" : "Não"}</td>
                  <td>{formatarData(arena.data_inicio)}</td>
                  <td>{formatarData(arena.data_vencimento)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {arenasFiltradas.length === 0 && (
            <div className="painel-saas-empty">Nenhuma arena encontrada.</div>
          )}
        </div>
      )}
    </section>
  );
}

function PainelResumoCard({ titulo, valor }) {
  return (
    <div className="painel-saas-summary-card">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}
