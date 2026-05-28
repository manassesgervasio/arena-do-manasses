import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { criarUsuarioAuth } from "../utils/criarUsuarioAuth";

const statusOpcoes = ["todos", "teste", "ativo", "suspenso", "cancelado"];
const planoOpcoes = ["todos", "teste", "basico", "profissional", "premium"];
const statusCadastroOpcoes = ["teste", "ativo", "suspenso", "cancelado"];
const planoCadastroOpcoes = ["teste", "basico", "profissional", "premium"];
const perfilResponsavelOpcoes = [
  "admin_arena",
  "gerente",
  "financeiro",
  "atendente",
];

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

function criarFormularioResponsavelInicial() {
  return {
    nome: "",
    email: "",
    telefone: "",
    perfil: "admin_arena",
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
  const [usuarios, setUsuarios] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [senhaTemporariaAuth, setSenhaTemporariaAuth] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [planoFiltro, setPlanoFiltro] = useState("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(criarFormularioInicial);
  const [slugEditadoManual, setSlugEditadoManual] = useState(false);
  const [salvandoArena, setSalvandoArena] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [arenaResponsavel, setArenaResponsavel] = useState(null);
  const [formularioResponsavel, setFormularioResponsavel] = useState(
    criarFormularioResponsavelInicial
  );
  const [salvandoResponsavel, setSalvandoResponsavel] = useState(false);
  const [erroResponsavel, setErroResponsavel] = useState("");

  async function carregarArenas() {
    setCarregando(true);
    setErro("");

    const [
      { data, error },
      { data: vinculosData, error: vinculosError },
      { data: usuariosData, error: usuariosError },
    ] = await Promise.all([
      supabase
        .from("arenas")
        .select(
          "id,nome,slug,telefone,cidade,estado,ativa,plano,status_assinatura,data_inicio,data_vencimento,observacao_admin,created_at,updated_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("usuarios_arenas")
        .select("id,usuario_id,arena_id,perfil,ativo,created_at,updated_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("usuarios_sistema")
        .select("id,nome,email,telefone,tipo_usuario,ativo,created_at,updated_at")
        .order("nome", { ascending: true }),
    ]);

    if (error || vinculosError || usuariosError) {
      const erroCarregamento = error || vinculosError || usuariosError;

      console.error("Erro ao carregar dados do Painel SaaS:", erroCarregamento);
      setErro(`Nao foi possivel carregar os dados do Painel SaaS. ${erroCarregamento.message}`);
      setArenas([]);
      setVinculos([]);
      setUsuarios([]);
      setCarregando(false);
      return;
    }

    setArenas(data || []);
    setVinculos(vinculosData || []);
    setUsuarios(usuariosData || []);
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
    setSenhaTemporariaAuth("");
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setErroCadastro("");
    setSlugEditadoManual(false);
    setFormulario(criarFormularioInicial());
  }

  function abrirFormularioResponsavel(arena) {
    setArenaResponsavel(arena);
    setFormularioResponsavel(criarFormularioResponsavelInicial());
    setErroResponsavel("");
    setMensagem("");
    setSenhaTemporariaAuth("");
  }

  function fecharFormularioResponsavel() {
    setArenaResponsavel(null);
    setFormularioResponsavel(criarFormularioResponsavelInicial());
    setErroResponsavel("");
  }

  function atualizarFormularioResponsavel(campo, valor) {
    setFormularioResponsavel((anterior) => ({
      ...anterior,
      [campo]: campo === "email" ? valor.toLowerCase() : valor,
    }));
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
    setSenhaTemporariaAuth("");

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

  async function salvarResponsavel(event) {
    event.preventDefault();

    if (!podeCadastrarArena) {
      setErroResponsavel("Apenas super_admin pode cadastrar responsaveis.");
      return;
    }

    if (!arenaResponsavel?.id) {
      setErroResponsavel("Selecione uma arena para vincular o responsavel.");
      return;
    }

    const nome = formularioResponsavel.nome.trim();
    const email = formularioResponsavel.email.trim().toLowerCase();
    const telefone = formularioResponsavel.telefone.trim();
    const perfil = formularioResponsavel.perfil;

    if (!nome || !email || !perfil) {
      setErroResponsavel("Preencha nome, e-mail e perfil.");
      return;
    }

    setSalvandoResponsavel(true);
    setErroResponsavel("");
    setMensagem("");
    setSenhaTemporariaAuth("");

    const agora = new Date().toISOString();
    const { data: usuarioExistente, error: buscarUsuarioError } = await supabase
      .from("usuarios_sistema")
      .select("id,nome,email,telefone,tipo_usuario,ativo")
      .eq("email", email)
      .maybeSingle();

    if (buscarUsuarioError) {
      console.error("Erro ao buscar usuario responsavel:", buscarUsuarioError);
      setErroResponsavel(
        `Nao foi possivel verificar o usuario responsavel. ${buscarUsuarioError.message}`
      );
      setSalvandoResponsavel(false);
      return;
    }

    let usuario = usuarioExistente;

    if (usuarioExistente) {
      const { data: usuarioAtualizado, error: atualizarUsuarioError } =
        await supabase
          .from("usuarios_sistema")
          .update({
            nome,
            telefone: telefone || null,
            ativo: true,
            updated_at: agora,
          })
          .eq("id", usuarioExistente.id)
          .select("id,nome,email,telefone,tipo_usuario,ativo")
          .single();

      if (atualizarUsuarioError) {
        console.error("Erro ao atualizar usuario responsavel:", atualizarUsuarioError);
        setErroResponsavel(
          `Nao foi possivel atualizar o usuario responsavel. ${atualizarUsuarioError.message}`
        );
        setSalvandoResponsavel(false);
        return;
      }

      usuario = usuarioAtualizado;
    } else {
      const { data: usuarioInserido, error: inserirUsuarioError } = await supabase
        .from("usuarios_sistema")
        .insert({
          nome,
          email,
          telefone: telefone || null,
          tipo_usuario: "arena",
          ativo: true,
          updated_at: agora,
        })
        .select("id,nome,email,telefone,tipo_usuario,ativo")
        .single();

      if (inserirUsuarioError) {
        console.error("Erro ao cadastrar usuario responsavel:", inserirUsuarioError);
        setErroResponsavel(
          `Nao foi possivel cadastrar o usuario responsavel. ${inserirUsuarioError.message}`
        );
        setSalvandoResponsavel(false);
        return;
      }

      usuario = usuarioInserido;
    }

    const { data: vinculoExistente, error: buscarVinculoError } = await supabase
      .from("usuarios_arenas")
      .select("id,usuario_id,arena_id,perfil,ativo")
      .eq("usuario_id", usuario.id)
      .eq("arena_id", arenaResponsavel.id)
      .maybeSingle();

    if (buscarVinculoError) {
      console.error("Erro ao buscar vinculo usuario-arena:", buscarVinculoError);
      setErroResponsavel(
        `Nao foi possivel verificar o vinculo com a arena. ${buscarVinculoError.message}`
      );
      setSalvandoResponsavel(false);
      return;
    }

    const operacaoVinculo = vinculoExistente
      ? supabase
          .from("usuarios_arenas")
          .update({
            perfil,
            ativo: true,
            updated_at: agora,
          })
          .eq("id", vinculoExistente.id)
      : supabase.from("usuarios_arenas").insert({
          usuario_id: usuario.id,
          arena_id: arenaResponsavel.id,
          perfil,
          ativo: true,
          updated_at: agora,
        });

    const { error: salvarVinculoError } = await operacaoVinculo;

    if (salvarVinculoError) {
      console.error("Erro ao salvar vinculo usuario-arena:", salvarVinculoError);
      setErroResponsavel(
        `Nao foi possivel vincular o responsavel a arena. ${salvarVinculoError.message}`
      );
      setSalvandoResponsavel(false);
      return;
    }

    try {
      const resultadoAuth = await criarUsuarioAuth({ email, nome });

      if (resultadoAuth.auth_existia) {
        setMensagem("Usuario vinculado com sucesso. O login Auth ja existia.");
      } else {
        setMensagem("Usuario cadastrado e login criado com sucesso.");
        if (resultadoAuth.senha_temporaria) {
          setSenhaTemporariaAuth(resultadoAuth.senha_temporaria);
        }
      }
    } catch (authError) {
      console.error("Erro ao criar login Auth automaticamente:", authError);
      setMensagem(
        "Usuario vinculado a arena, mas nao foi possivel criar o login automaticamente. Crie o acesso manualmente no Supabase Auth."
      );
    }

    fecharFormularioResponsavel();
    await carregarArenas();
    setSalvandoResponsavel(false);
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

  const usuariosPorId = useMemo(() => {
    return usuarios.reduce((mapa, usuario) => {
      mapa[usuario.id] = usuario;
      return mapa;
    }, {});
  }, [usuarios]);

  const responsaveisPorArena = useMemo(() => {
    return vinculos.reduce((mapa, vinculo) => {
      if (!vinculo.ativo) return mapa;

      const usuario = usuariosPorId[vinculo.usuario_id];
      if (!usuario) return mapa;

      if (!mapa[vinculo.arena_id]) {
        mapa[vinculo.arena_id] = [];
      }

      mapa[vinculo.arena_id].push({
        ...vinculo,
        usuario,
      });

      mapa[vinculo.arena_id].sort((a, b) => {
        if (a.perfil === "admin_arena" && b.perfil !== "admin_arena") return -1;
        if (a.perfil !== "admin_arena" && b.perfil === "admin_arena") return 1;
        return a.usuario.nome.localeCompare(b.usuario.nome);
      });

      return mapa;
    }, {});
  }, [usuariosPorId, vinculos]);

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
      {senhaTemporariaAuth && (
        <div className="painel-saas-auth-secret">
          <span>Senha temporaria: {senhaTemporariaAuth}</span>
          <small>Anote esta senha. Ela sera exibida apenas agora.</small>
        </div>
      )}

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

      {arenaResponsavel && (
        <form className="painel-saas-form" onSubmit={salvarResponsavel}>
          <div className="painel-saas-form-header">
            <h3>Cadastrar responsável</h3>
            <button type="button" onClick={fecharFormularioResponsavel}>
              Cancelar
            </button>
          </div>

          <div className="painel-saas-form-context">
            Arena: <strong>{arenaResponsavel.nome}</strong>
          </div>

          {erroResponsavel && (
            <div className="painel-saas-error">{erroResponsavel}</div>
          )}

          <label>
            <span>Nome do responsável</span>
            <input
              type="text"
              value={formularioResponsavel.nome}
              onChange={(event) =>
                atualizarFormularioResponsavel("nome", event.target.value)
              }
              required
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={formularioResponsavel.email}
              onChange={(event) =>
                atualizarFormularioResponsavel("email", event.target.value)
              }
              required
            />
          </label>

          <label>
            <span>Telefone</span>
            <input
              type="text"
              value={formularioResponsavel.telefone}
              onChange={(event) =>
                atualizarFormularioResponsavel("telefone", event.target.value)
              }
            />
          </label>

          <label>
            <span>Perfil</span>
            <select
              value={formularioResponsavel.perfil}
              onChange={(event) =>
                atualizarFormularioResponsavel("perfil", event.target.value)
              }
              required
            >
              {perfilResponsavelOpcoes.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {rotulo(perfil)}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={salvandoResponsavel}>
            {salvandoResponsavel ? "Salvando..." : "Salvar responsável"}
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
                <th>Responsaveis</th>
                <th>Data de início</th>
                <th>Data de vencimento</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {arenasFiltradas.map((arena) => {
                const responsaveis = responsaveisPorArena[arena.id] || [];

                return (
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
                  <td>
                    {responsaveis.length > 0 ? (
                      <div className="painel-saas-responsaveis">
                        {responsaveis.map((responsavel) => (
                          <div key={responsavel.id}>
                            <strong>{responsavel.usuario.nome}</strong>
                            <span>{responsavel.usuario.email}</span>
                            <small>{rotulo(responsavel.perfil)}</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{formatarData(arena.data_inicio)}</td>
                  <td>{formatarData(arena.data_vencimento)}</td>
                  <td>
                    {podeCadastrarArena && (
                      <button
                        type="button"
                        className="painel-saas-action"
                        onClick={() => abrirFormularioResponsavel(arena)}
                      >
                        Adicionar responsavel
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
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
