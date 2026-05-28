import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const statusOpcoes = ["todos", "teste", "ativo", "suspenso", "cancelado"];
const planoOpcoes = ["todos", "teste", "basico", "profissional", "premium"];
const statusCadastroOpcoes = ["teste", "ativo", "suspenso", "cancelado"];
const planoCadastroOpcoes = ["teste", "basico", "profissional", "premium"];

function obterDataHoje() {
  return new Date().toISOString().split("T")[0];
}

function criarFormularioInicial() {
  return {
    nome: "",
    slug: "",
    telefone: "",
    cidade: "",
    estado: "",
    plano: "teste",
    statusAssinatura: "teste",
    dataInicio: obterDataHoje(),
    dataVencimento: "",
    observacaoAdmin: "",
  };
}

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

function gerarSlug(texto) {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rotulo(valor) {
  if (!valor) return "-";
  return valor.replace("_", " ");
}

export default function PainelCentralSaaS({ contextoArena, onVoltar }) {
  const podeCadastrarArena =
    contextoArena?.usuarioAtual?.tipo_usuario === "super_admin";
  const [arenas, setArenas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [planoFiltro, setPlanoFiltro] = useState("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(criarFormularioInicial);
  const [slugEditadoManual, setSlugEditadoManual] = useState(false);
  const [salvandoArena, setSalvandoArena] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");

  async function carregarArenas() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("arenas")
      .select(
        "id,nome,slug,telefone,cidade,estado,ativa,plano,status_assinatura,data_inicio,data_vencimento,observacao_admin,created_at,updated_at"
      )
      .order("created_at", { ascending: false });

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

  useEffect(() => {
    carregarArenas();
  }, []);

  function atualizarFormulario(campo, valor) {
    setFormulario((anterior) => {
      const proximo = {
        ...anterior,
        [campo]: valor,
      };

      if (campo === "nome" && !slugEditadoManual) {
        proximo.slug = gerarSlug(valor);
      }

      if (campo === "slug") {
        proximo.slug = gerarSlug(valor);
      }

      return proximo;
    });

    if (campo === "slug") {
      setSlugEditadoManual(true);
    }
  }

  function abrirFormulario() {
    setFormulario(criarFormularioInicial());
    setSlugEditadoManual(false);
    setErroCadastro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setErroCadastro("");
    setSlugEditadoManual(false);
    setFormulario(criarFormularioInicial());
  }

  async function salvarArena(event) {
    event.preventDefault();

    if (!podeCadastrarArena) {
      setErroCadastro("Apenas super_admin pode cadastrar novas arenas.");
      return;
    }

    const nome = formulario.nome.trim();
    const slug = gerarSlug(formulario.slug);

    if (!nome || !slug) {
      setErroCadastro("Preencha nome da arena e slug.");
      return;
    }

    setSalvandoArena(true);
    setErroCadastro("");
    setMensagem("");

    const payload = {
      nome,
      slug,
      telefone: formulario.telefone.trim() || null,
      cidade: formulario.cidade.trim() || null,
      estado: formulario.estado.trim() || null,
      plano: formulario.plano,
      status_assinatura: formulario.statusAssinatura,
      data_inicio: formulario.dataInicio || obterDataHoje(),
      data_vencimento: formulario.dataVencimento || null,
      observacao_admin: formulario.observacaoAdmin.trim() || null,
      ativa: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("arenas").insert(payload);

    if (error) {
      console.error("Erro ao cadastrar arena:", error);
      const mensagemErro =
        error.code === "23505" || error.message?.toLowerCase().includes("duplicate")
          ? "Já existe uma arena cadastrada com esse slug."
          : `Nao foi possivel cadastrar a arena. ${error.message}`;

      setErroCadastro(mensagemErro);
      setSalvandoArena(false);
      return;
    }

    setMensagem("Arena cadastrada com sucesso.");
    fecharFormulario();
    await carregarArenas();
    setSalvandoArena(false);
  }

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

      {podeCadastrarArena && (
        <div className="painel-saas-toolbar">
          <button type="button" onClick={abrirFormulario}>
            Cadastrar nova arena
          </button>
        </div>
      )}

      {mensagem && <div className="painel-saas-confirmation">{mensagem}</div>}

      {mostrarFormulario && (
        <form className="painel-saas-form" onSubmit={salvarArena}>
          <div className="painel-saas-form-header">
            <h3>Cadastrar nova arena</h3>
            <button type="button" onClick={fecharFormulario}>
              Cancelar
            </button>
          </div>

          {erroCadastro && <div className="painel-saas-error">{erroCadastro}</div>}

          <label>
            <span>Nome da arena</span>
            <input
              type="text"
              value={formulario.nome}
              onChange={(event) => atualizarFormulario("nome", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Slug</span>
            <input
              type="text"
              value={formulario.slug}
              onChange={(event) => atualizarFormulario("slug", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Telefone</span>
            <input
              type="text"
              value={formulario.telefone}
              onChange={(event) => atualizarFormulario("telefone", event.target.value)}
            />
          </label>

          <label>
            <span>Cidade</span>
            <input
              type="text"
              value={formulario.cidade}
              onChange={(event) => atualizarFormulario("cidade", event.target.value)}
            />
          </label>

          <label>
            <span>Estado</span>
            <input
              type="text"
              value={formulario.estado}
              onChange={(event) => atualizarFormulario("estado", event.target.value)}
            />
          </label>

          <label>
            <span>Plano</span>
            <select
              value={formulario.plano}
              onChange={(event) => atualizarFormulario("plano", event.target.value)}
            >
              {planoCadastroOpcoes.map((plano) => (
                <option key={plano} value={plano}>
                  {rotulo(plano)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status da assinatura</span>
            <select
              value={formulario.statusAssinatura}
              onChange={(event) =>
                atualizarFormulario("statusAssinatura", event.target.value)
              }
            >
              {statusCadastroOpcoes.map((status) => (
                <option key={status} value={status}>
                  {rotulo(status)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Data de início</span>
            <input
              type="date"
              value={formulario.dataInicio}
              onChange={(event) =>
                atualizarFormulario("dataInicio", event.target.value)
              }
            />
          </label>

          <label>
            <span>Data de vencimento</span>
            <input
              type="date"
              value={formulario.dataVencimento}
              onChange={(event) =>
                atualizarFormulario("dataVencimento", event.target.value)
              }
            />
          </label>

          <label className="painel-saas-form-observacao">
            <span>Observação administrativa</span>
            <textarea
              value={formulario.observacaoAdmin}
              onChange={(event) =>
                atualizarFormulario("observacaoAdmin", event.target.value)
              }
            />
          </label>

          <button type="submit" disabled={salvandoArena}>
            {salvandoArena ? "Salvando..." : "Salvar arena"}
          </button>
        </form>
      )}

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
