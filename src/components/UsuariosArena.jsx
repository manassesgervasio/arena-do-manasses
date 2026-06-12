import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { criarUsuarioAuth } from "../utils/criarUsuarioAuth";
import { Button, EmptyState, Input, LoadingState, Select } from "./ui";

const perfilOpcoes = ["atendente", "gerente", "financeiro", "admin_arena"];

function criarFormularioInicial() {
  return {
    nome: "",
    email: "",
    telefone: "",
    perfil: "atendente",
  };
}

function formatarData(dataTexto) {
  if (!dataTexto) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(dataTexto));
}

function rotulo(valor) {
  if (!valor) return "-";
  return valor.replace("_", " ");
}

export default function UsuariosArena({ contextoArena, onVoltar }) {
  const { arenaAtual, usuarioAtual, perfilAtual, carregandoContexto, erroContexto } =
    contextoArena || {};
  const arenaAtualId = arenaAtual?.id;
  const podeGerenciarUsuarios =
    perfilAtual === "admin_arena" || usuarioAtual?.tipo_usuario === "super_admin";
  const [usuarios, setUsuarios] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [senhaTemporariaAuth, setSenhaTemporariaAuth] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(criarFormularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [alterandoId, setAlterandoId] = useState(null);

  async function carregarUsuarios() {
    if (carregandoContexto) return;

    if (!arenaAtualId) {
      setErro(erroContexto || "Nao foi possivel carregar o contexto da arena.");
      setUsuarios([]);
      setVinculos([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data: vinculosData, error: vinculosError } = await supabase
      .from("usuarios_arenas")
      .select("id,usuario_id,arena_id,perfil,ativo,created_at,updated_at")
      .eq("arena_id", arenaAtualId)
      .order("created_at", { ascending: true });

    if (vinculosError) {
      console.error("Erro ao carregar vinculos da arena:", vinculosError);
      setErro(`Nao foi possivel carregar os usuarios da arena. ${vinculosError.message}`);
      setUsuarios([]);
      setVinculos([]);
      setCarregando(false);
      return;
    }

    const usuarioIds = [...new Set((vinculosData || []).map((vinculo) => vinculo.usuario_id))];

    if (usuarioIds.length === 0) {
      setUsuarios([]);
      setVinculos(vinculosData || []);
      setCarregando(false);
      return;
    }

    const { data: usuariosData, error: usuariosError } = await supabase
      .from("usuarios_sistema")
      .select("id,nome,email,telefone,tipo_usuario,ativo,created_at,updated_at")
      .in("id", usuarioIds)
      .order("nome", { ascending: true });

    if (usuariosError) {
      console.error("Erro ao carregar usuarios da arena:", usuariosError);
      setErro(`Nao foi possivel carregar os dados dos usuarios. ${usuariosError.message}`);
      setUsuarios([]);
      setVinculos([]);
      setCarregando(false);
      return;
    }

    setUsuarios(usuariosData || []);
    setVinculos(vinculosData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarUsuarios();
  }, [arenaAtualId, carregandoContexto, erroContexto]);

  const usuariosPorId = useMemo(() => {
    return usuarios.reduce((mapa, usuario) => {
      mapa[usuario.id] = usuario;
      return mapa;
    }, {});
  }, [usuarios]);

  const usuariosVinculados = useMemo(() => {
    return vinculos
      .map((vinculo) => ({
        ...vinculo,
        usuario: usuariosPorId[vinculo.usuario_id],
      }))
      .filter((vinculo) => vinculo.usuario)
      .sort((a, b) => {
        if (a.perfil === "admin_arena" && b.perfil !== "admin_arena") return -1;
        if (a.perfil !== "admin_arena" && b.perfil === "admin_arena") return 1;
        if (a.ativo && !b.ativo) return -1;
        if (!a.ativo && b.ativo) return 1;
        return a.usuario.nome.localeCompare(b.usuario.nome);
      });
  }, [usuariosPorId, vinculos]);

  const adminsAtivos = useMemo(() => {
    return usuariosVinculados.filter(
      (vinculo) => vinculo.ativo && vinculo.perfil === "admin_arena"
    );
  }, [usuariosVinculados]);

  function atualizarFormulario(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: campo === "email" ? valor.toLowerCase() : valor,
    }));
  }

  function abrirFormulario() {
    setFormulario(criarFormularioInicial());
    setErro("");
    setMensagem("");
    setSenhaTemporariaAuth("");
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setFormulario(criarFormularioInicial());
  }

  async function salvarUsuario(event) {
    event.preventDefault();

    if (!podeGerenciarUsuarios) {
      setErro("Voce nao tem permissao para gerenciar usuarios desta arena.");
      return;
    }

    if (!arenaAtualId) {
      setErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

    const nome = formulario.nome.trim();
    const email = formulario.email.trim().toLowerCase();
    const telefone = formulario.telefone.trim();
    const perfil = formulario.perfil;

    if (!nome || !email || !perfil) {
      setErro("Preencha nome, e-mail e perfil.");
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");
    setSenhaTemporariaAuth("");

    const agora = new Date().toISOString();
    const { data: usuarioExistente, error: buscarUsuarioError } = await supabase
      .from("usuarios_sistema")
      .select("id,nome,email,telefone,tipo_usuario,ativo")
      .eq("email", email)
      .maybeSingle();

    if (buscarUsuarioError) {
      console.error("Erro ao buscar usuario:", buscarUsuarioError);
      setErro(`Nao foi possivel verificar o usuario. ${buscarUsuarioError.message}`);
      setSalvando(false);
      return;
    }

    let usuario = usuarioExistente;

    if (usuarioExistente) {
      const { data: usuarioAtualizado, error: atualizarUsuarioError } = await supabase
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
        console.error("Erro ao atualizar usuario:", atualizarUsuarioError);
        setErro(`Nao foi possivel atualizar o usuario. ${atualizarUsuarioError.message}`);
        setSalvando(false);
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
        console.error("Erro ao cadastrar usuario:", inserirUsuarioError);
        setErro(`Nao foi possivel cadastrar o usuario. ${inserirUsuarioError.message}`);
        setSalvando(false);
        return;
      }

      usuario = usuarioInserido;
    }

    const { data: vinculoExistente, error: buscarVinculoError } = await supabase
      .from("usuarios_arenas")
      .select("id,usuario_id,arena_id,perfil,ativo")
      .eq("usuario_id", usuario.id)
      .eq("arena_id", arenaAtualId)
      .maybeSingle();

    if (buscarVinculoError) {
      console.error("Erro ao buscar vinculo usuario-arena:", buscarVinculoError);
      setErro(`Nao foi possivel verificar o vinculo com a arena. ${buscarVinculoError.message}`);
      setSalvando(false);
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
          arena_id: arenaAtualId,
          perfil,
          ativo: true,
          updated_at: agora,
        });

    const { error: salvarVinculoError } = await operacaoVinculo;

    if (salvarVinculoError) {
      console.error("Erro ao salvar vinculo usuario-arena:", salvarVinculoError);
      setErro(`Nao foi possivel vincular o usuario a arena. ${salvarVinculoError.message}`);
      setSalvando(false);
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

    fecharFormulario();
    await carregarUsuarios();
    setSalvando(false);
  }

  async function alterarStatusVinculo(vinculo, ativo) {
    if (!podeGerenciarUsuarios) {
      setErro("Voce nao tem permissao para gerenciar usuarios desta arena.");
      return;
    }

    if (!ativo && vinculo.perfil === "admin_arena") {
      const ehProprioUsuario = vinculo.usuario_id === usuarioAtual?.id;
      const unicoAdminAtivo = adminsAtivos.length === 1;

      if (ehProprioUsuario && unicoAdminAtivo) {
        setErro("Nao e permitido desativar seu proprio acesso sendo o unico admin_arena ativo.");
        return;
      }

      const confirmarAdmin = confirm(
        "Este usuario e admin_arena. Desativar este acesso pode limitar a administracao da arena. Deseja continuar?"
      );

      if (!confirmarAdmin) return;
    } else if (!confirm("Confirmar alteracao de acesso deste usuario?")) {
      return;
    }

    setAlterandoId(vinculo.id);
    setErro("");
    setMensagem("");

    const { error } = await supabase
      .from("usuarios_arenas")
      .update({
        ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vinculo.id)
      .eq("arena_id", arenaAtualId);

    if (error) {
      console.error("Erro ao alterar acesso do usuario:", error);
      setErro(`Nao foi possivel alterar o acesso do usuario. ${error.message}`);
      setAlterandoId(null);
      return;
    }

    setMensagem(ativo ? "Usuario reativado com sucesso." : "Usuario desativado com sucesso.");
    await carregarUsuarios();
    setAlterandoId(null);
  }

  if (!podeGerenciarUsuarios) {
    return (
      <section className="usuarios-arena">
        <div className="usuarios-arena-header">
          <div>
            <h2>Usuarios da Arena</h2>
            <p>Gerencie os acessos da arena atual</p>
          </div>
          <Button type="button" onClick={onVoltar}>
            Voltar
          </Button>
        </div>
        <div className="usuarios-arena-error">
          Voce nao tem permissao para gerenciar usuarios desta arena.
        </div>
      </section>
    );
  }

  return (
    <section className="usuarios-arena">
      <div className="usuarios-arena-header">
        <div>
          <h2>Usuarios da Arena</h2>
          <p>Gerencie os acessos da arena atual</p>
          <span>
            Arena: <strong>{arenaAtual?.nome || "-"}</strong>
          </span>
        </div>

        <Button type="button" onClick={onVoltar}>
          Voltar
        </Button>
      </div>

      <div className="usuarios-arena-toolbar">
        <Button type="button" onClick={abrirFormulario}>
          Adicionar usuario
        </Button>
      </div>

      {mensagem && <div className="usuarios-arena-confirmation">{mensagem}</div>}
      {senhaTemporariaAuth && (
        <div className="usuarios-arena-auth-secret">
          <span>Senha temporaria: {senhaTemporariaAuth}</span>
          <small>Anote esta senha. Ela sera exibida apenas agora.</small>
        </div>
      )}
      {erro && <div className="usuarios-arena-error">{erro}</div>}

      {mostrarFormulario && (
        <form className="usuarios-arena-form" onSubmit={salvarUsuario}>
          <div className="usuarios-arena-form-header">
            <h3>Adicionar usuario</h3>
            <Button type="button" onClick={fecharFormulario}>
              Cancelar
            </Button>
          </div>

          <label>
            <span>Nome</span>
            <Input
              type="text"
              value={formulario.nome}
              onChange={(event) => atualizarFormulario("nome", event.target.value)}
              required
            />
          </label>

          <label>
            <span>E-mail</span>
            <Input
              type="email"
              value={formulario.email}
              onChange={(event) => atualizarFormulario("email", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Telefone</span>
            <Input
              type="text"
              value={formulario.telefone}
              onChange={(event) => atualizarFormulario("telefone", event.target.value)}
            />
          </label>

          <label>
            <span>Perfil</span>
            <Select
              value={formulario.perfil}
              onChange={(event) => atualizarFormulario("perfil", event.target.value)}
              required
            >
              {perfilOpcoes.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {rotulo(perfil)}
                </option>
              ))}
            </Select>
          </label>

          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar usuario"}
          </Button>
        </form>
      )}

      {carregando ? (
        <LoadingState className="usuarios-arena-loading">
          Carregando usuarios...
        </LoadingState>
      ) : (
        <div className="usuarios-arena-table-wrap">
          <table className="usuarios-arena-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Perfil</th>
                <th>Ativo</th>
                <th>Criado em</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {usuariosVinculados.map((vinculo) => (
                <tr key={vinculo.id}>
                  <td>
                    <strong>{vinculo.usuario.nome}</strong>
                  </td>
                  <td>{vinculo.usuario.email}</td>
                  <td>{vinculo.usuario.telefone || "-"}</td>
                  <td>
                    <span className="usuarios-arena-badge">
                      {rotulo(vinculo.perfil)}
                    </span>
                  </td>
                  <td>{vinculo.ativo ? "Sim" : "Nao"}</td>
                  <td>{formatarData(vinculo.created_at)}</td>
                  <td>
                    <Button
                      type="button"
                      className="usuarios-arena-action"
                      disabled={alterandoId === vinculo.id}
                      onClick={() => alterarStatusVinculo(vinculo, !vinculo.ativo)}
                    >
                      {vinculo.ativo ? "Desativar" : "Reativar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuariosVinculados.length === 0 && (
            <EmptyState className="usuarios-arena-empty">
              Nenhum usuario vinculado.
            </EmptyState>
          )}
        </div>
      )}
    </section>
  );
}
