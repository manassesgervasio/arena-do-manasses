import { useEffect, useState } from "react";
import { diasSemana, horarios, statusLista, tipoLista } from "./constants";
import { useAgendaSemana } from "./hooks/useAgendaSemana";
import { useArenaAtual } from "./hooks/useArenaAtual";
import { useArenaPublica } from "./hooks/useArenaPublica";
import { useClientes } from "./hooks/useClientes";
import { useResumoReservas } from "./hooks/useResumoReservas";
import Login from "./components/Login";
import BuscaArenasPublica from "./pages/BuscaArenasPublica";
import Home from "./pages/Home";
import { supabase } from "./supabase";  
import { formatarData, formatarDataBR, moeda } from "./utils";
import { notificarGestorNovaReserva } from "./services/whatsappService";

const PERFIL_PADRAO = "Funcionario";
const PERFIS_PERMISSOES = {
  Administrador: {
    podeLimparPago: true,
    podeEditarTudo: true,
  },
  Funcionario: {
    podeLimparPago: false,
    podeEditarTudo: false,
  },
};

function perfilValido(perfil) {
  return Object.prototype.hasOwnProperty.call(PERFIS_PERMISSOES, perfil);
}

function obterPerfilDaSessao(session) {
  if (!session) return null;

  const perfil = session.user?.user_metadata?.perfil;

  return perfilValido(perfil) ? perfil : PERFIL_PADRAO;
}

export default function App() {
  const [sessaoAuth, setSessaoAuth] = useState(null);
  const [authCarregando, setAuthCarregando] = useState(true);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [perfilLogado, setPerfilLogado] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const rotaLogin = normalizarPathname(pathname) === "/login";
  const slugPublico = obterSlugPublico(pathname);
  const temRotaPublicaSlug = Boolean(slugPublico);
  const contextoArenaLogada = useArenaAtual(sessaoAuth);
  const contextoArenaPublica = useArenaPublica(slugPublico);
  const contextoArena = temRotaPublicaSlug
    ? contextoArenaPublica
    : contextoArenaLogada;
  const sessaoOperacional = temRotaPublicaSlug ? null : sessaoAuth;
  const arenaAtualId = contextoArena.arenaAtual?.id;
  const { dataBase, dias, mudarSemana, alterarData } = useAgendaSemana();
  const [mesFiltro, setMesFiltro] = useState(() => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
});

  const [reservas, setReservas] = useState({});
  const [reservasArenaId, setReservasArenaId] = useState(null);
  const [totalMensalistasPago, setTotalMensalistasPago] = useState(0);
  const [horariosMensalistas, setHorariosMensalistas] = useState({});
  const [versaoHorariosMensalistas, setVersaoHorariosMensalistas] = useState(0);
  const [notificacoesPendentes, setNotificacoesPendentes] = useState([]);
  const [pendenciasPagamento, setPendenciasPagamento] = useState([]);

  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  useEffect(() => {
  function atualizarPathname() {
    setPathname(window.location.pathname);
  }

  window.addEventListener("popstate", atualizarPathname);

  return () => {
    window.removeEventListener("popstate", atualizarPathname);
  };
}, []);

  useEffect(() => {
  if (sessaoAuth && rotaLogin) {
    irParaRaiz(setPathname, { replace: true });
  }
}, [sessaoAuth, rotaLogin]);

  useEffect(() => {
  if (temRotaPublicaSlug && contextoArena.arenaAtual?.nome) {
    document.title = `Horários disponíveis - ${contextoArena.arenaAtual.nome} | ArenaBase`;
  }
}, [temRotaPublicaSlug, contextoArena.arenaAtual?.nome]);

  useEffect(() => {
  let ativo = true;

  async function carregarSessao() {
    const { data } = await supabase.auth.getSession();

    if (!ativo) return;

    setSessaoAuth(data.session);
    setPerfilLogado(obterPerfilDaSessao(data.session));
    setMostrarLogin(false);
    setAuthCarregando(false);
  }

  carregarSessao();

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!ativo) return;

    setSessaoAuth(session);
    setPerfilLogado(obterPerfilDaSessao(session));
    if (session) setMostrarLogin(false);
    setAuthCarregando(false);
  });

  return () => {
    ativo = false;
    data.subscription.unsubscribe();
  };
}, []);

  useEffect(() => {
  let ativo = true;

  async function carregarReservas() {
    setReservas({});
    setReservasArenaId(null);

    const modoVisitante = !sessaoOperacional;
    const primeiroDia = dias?.[0] ? formatarDataLocal(dias[0]) : "";
    const ultimoDia = dias?.length
      ? formatarDataLocal(dias[dias.length - 1])
      : "";

    if (modoVisitante) {
      console.log("modo visitante");
      console.log("arenaAtual", contextoArena.arenaAtual);
      console.log("periodoVisivel", primeiroDia, ultimoDia);
    }

    if (!arenaAtualId) {
      if (modoVisitante) {
        console.log("reservasPublicas", []);
        console.log(
          "erroReservasPublicas",
          "Arena atual sem id. A consulta publica de reservas nao foi executada."
        );
      }

      return;
    }

    const { data, error } =
      modoVisitante && primeiroDia && ultimoDia
        ? await buscarHorariosOcupadosPublicos(primeiroDia, ultimoDia)
        : await supabase
            .from("reservas")
            .select("*")
            .eq("arena_id", arenaAtualId);

    if (!ativo) return;

    if (modoVisitante) {
      console.log("reservasPublicas", data);
      console.log("erroReservasPublicas", error);
    }

    if (error) {
      console.log("Erro ao carregar reservas:", error);
      setReservas({});
      setReservasArenaId(null);
      return;
    }

    const reservasFormatadas = {};

    data.forEach((reserva) => {
      const chave = `${reserva.data}_${reserva.horario}`;

      reservasFormatadas[chave] = modoVisitante
        ? normalizarHorarioPublicoOcupado(reserva)
        : {
            id: reserva.id || "",
            arena_id: reserva.arena_id || "",
            data: reserva.data || "",
            horario: reserva.horario || "",
            origem: reserva.origem || "",
            cliente: reserva.cliente || "",
            telefone: reserva.telefone || "",
            valor: reserva.valor || "",
            status: reserva.status || "Livre",
            tipo: reserva.tipo || "Avulso",
            grupoFixo: reserva.grupo_fixo || "",
          };
    });

    if (modoVisitante) {
      console.log("reservasPublicasFormatadas", reservasFormatadas);
    }

    setReservas(reservasFormatadas);
    setReservasArenaId(arenaAtualId);
  }

  carregarReservas();

  return () => {
    ativo = false;
  };
}, [sessaoOperacional, arenaAtualId, dias]);

  useEffect(() => {
  if (!sessaoOperacional || !arenaAtualId) {
    setNotificacoesPendentes([]);
    setPendenciasPagamento([]);
    return;
  }

  let ativo = true;

  async function carregarNotificacoesPendentes() {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("arena_id", arenaAtualId)
      .in("status", ["Pendente", "Reservado"])
      .lte("data", obterDataHojeTexto())
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (!ativo) return;

    if (error) {
      console.error("Erro ao carregar pendências da arena:", error);
      setNotificacoesPendentes([]);
      setPendenciasPagamento([]);
      return;
    }

    setNotificacoesPendentes((data || []).filter(ehSolicitacaoAgendamento));
    setPendenciasPagamento((data || []).filter(ehPendenciaPagamento));
  }

  carregarNotificacoesPendentes();

  return () => {
    ativo = false;
  };
}, [sessaoOperacional, arenaAtualId]);

  useEffect(() => {
  if (!sessaoOperacional || !arenaAtualId) {
    setTotalMensalistasPago(0);
    return;
  }

  let ativo = true;

  async function carregarTotalMensalistasPago() {
    const [
      { data: mensalistasData, error: mensalistasError },
      { data, error },
    ] = await Promise.all([
      supabase
        .from("mensalistas")
        .select("id")
        .eq("arena_id", arenaAtualId),
      supabase
        .from("mensalista_pagamentos")
        .select("id,mensalista_id,competencia,valor,situacao")
        .eq("arena_id", arenaAtualId)
        .eq("competencia", mesFiltro)
        .eq("situacao", "Pago"),
    ]);

    if (!ativo) return;

    if (mensalistasError || error) {
      console.log("Erro ao carregar total pago de mensalistas:", mensalistasError || error);
      setTotalMensalistasPago(0);
      return;
    }

    const mensalistasExistentes = new Set(
      (mensalistasData || []).map((mensalista) => mensalista.id)
    );
    const pagamentosPorMensalista = {};

    (data || []).forEach((pagamento) => {
      if (!mensalistasExistentes.has(pagamento.mensalista_id)) return;

      if (!pagamentosPorMensalista[pagamento.mensalista_id]) {
        pagamentosPorMensalista[pagamento.mensalista_id] = pagamento;
      }
    });

    const totalPago = Object.values(pagamentosPorMensalista).reduce(
      (total, pagamento) => total + Number(pagamento.valor || 0),
      0
    );

    setTotalMensalistasPago(totalPago);
  }

  carregarTotalMensalistasPago();

  return () => {
    ativo = false;
  };
}, [sessaoOperacional, arenaAtualId, mesFiltro, versaoHorariosMensalistas]);

  useEffect(() => {
  if (!sessaoOperacional || !arenaAtualId) {
    setHorariosMensalistas({});
    return;
  }

  let ativo = true;

  async function carregarHorariosMensalistas() {
    const { data: mensalistasData, error: mensalistasError } = await supabase
      .from("mensalistas")
      .select("id,nome,status")
      .eq("arena_id", arenaAtualId)
      .eq("status", "Ativo");

    if (!ativo) return;

    if (mensalistasError) {
      console.log("Erro ao carregar mensalistas ativos:", mensalistasError);
      setHorariosMensalistas({});
      return;
    }

    const mensalistasAtivos = mensalistasData || [];
    const mensalistasPorId = {};
    const mensalistaIds = mensalistasAtivos.map((mensalista) => {
      mensalistasPorId[mensalista.id] = mensalista;
      return mensalista.id;
    });

    if (mensalistaIds.length === 0) {
      setHorariosMensalistas({});
      return;
    }

    const { data: horariosData, error: horariosError } = await supabase
      .from("mensalista_horarios")
      .select("id,mensalista_id,dia_semana,horario,ativo")
      .eq("arena_id", arenaAtualId)
      .in("mensalista_id", mensalistaIds)
      .eq("ativo", true);

    if (!ativo) return;

    if (horariosError) {
      console.log("Erro ao carregar horários de mensalistas:", horariosError);
      setHorariosMensalistas({});
      return;
    }

    const proximosHorarios = {};

    (horariosData || []).forEach((horarioContratado) => {
      const mensalista = mensalistasPorId[horarioContratado.mensalista_id];
      const chave = `${horarioContratado.dia_semana}_${horarioContratado.horario}`;

      if (!mensalista || proximosHorarios[chave]) return;

      proximosHorarios[chave] = {
        id: horarioContratado.id,
        mensalistaId: mensalista.id,
        nome: mensalista.nome,
        diaSemana: horarioContratado.dia_semana,
        horario: horarioContratado.horario,
      };
    });

    setHorariosMensalistas(proximosHorarios);
  }

  carregarHorariosMensalistas();

  return () => {
    ativo = false;
  };
}, [sessaoOperacional, arenaAtualId, versaoHorariosMensalistas]);

  async function buscarHorariosOcupadosPublicos(primeiroDia, ultimoDia) {
    const { data, error } = await supabase.rpc(
      "agenda_publica_horarios_ocupados",
      {
        p_arena_slug: contextoArena.arenaAtual?.slug || "",
        p_data_inicio: primeiroDia,
        p_data_fim: ultimoDia,
      }
    );

    if (!error) {
      return { data: data || [], error: null };
    }

    if (!erroRecursoPublicoInexistente(error)) {
      return { data: null, error };
    }

    console.warn(
      "Fallback temporario: agenda_publica_horarios_ocupados ainda nao existe. Remover apos aplicar a migration RLS ArenaBase.",
      error
    );

    // Fallback temporario para ambiente antes da migration RLS ArenaBase.
    // Remover depois que agenda_publica_horarios_ocupados estiver aplicada.
    return buscarHorariosOcupadosPublicosFallback(primeiroDia, ultimoDia);
  }

  async function buscarHorariosOcupadosPublicosFallback(primeiroDia, ultimoDia) {
    const { data: reservasData, error: reservasError } = await supabase
      .from("reservas")
      .select("arena_id,data,horario,status,tipo")
      .eq("arena_id", arenaAtualId)
      .gte("data", primeiroDia)
      .lte("data", ultimoDia);

    if (reservasError) {
      return { data: null, error: reservasError };
    }

    const { data: mensalistasData, error: mensalistasError } = await supabase
      .from("mensalistas")
      .select("id,status")
      .eq("arena_id", arenaAtualId)
      .eq("status", "Ativo");

    if (mensalistasError) {
      return { data: null, error: mensalistasError };
    }

    const mensalistaIds = (mensalistasData || []).map((mensalista) => mensalista.id);

    if (!mensalistaIds.length) {
      return { data: reservasData || [], error: null };
    }

    const { data: horariosData, error: horariosError } = await supabase
      .from("mensalista_horarios")
      .select("arena_id,mensalista_id,dia_semana,horario,ativo")
      .eq("arena_id", arenaAtualId)
      .in("mensalista_id", mensalistaIds)
      .eq("ativo", true);

    if (horariosError) {
      return { data: null, error: horariosError };
    }

    return {
      data: [
        ...(reservasData || []),
        ...expandirHorariosMensalistasPublicos(
          horariosData || [],
          primeiroDia,
          ultimoDia
        ),
      ],
      error: null,
    };
  }

  function normalizarHorarioPublicoOcupado(reserva) {
    const statusPublico =
      reserva.status_publico === "Pendente" || reserva.status === "Pendente"
        ? "Pendente"
        : "Reservado";

    return {
      id: "",
      arena_id: reserva.arena_id || arenaAtualId,
      data: reserva.data || "",
      horario: reserva.horario || "",
      origem: "",
      cliente: "",
      telefone: "",
      valor: "",
      status: statusPublico,
      tipo: "Avulso",
      grupoFixo: "",
    };
  }

  function recarregarHorariosMensalistas() {
    setVersaoHorariosMensalistas((versao) => versao + 1);
  }

  function chaveReserva(dataTexto, horario) {
    return `${dataTexto}_${horario}`;
  }

  function pegarReserva(dataTexto, horario) {
    if (reservasArenaId !== arenaAtualId) {
      return {
        id: "",
        arena_id: "",
        data: dataTexto,
        horario,
        origem: "",
        cliente: "",
        telefone: "",
        valor: "",
        status: "Livre",
        tipo: "Avulso",
        grupoFixo: "",
      };
    }

    const chave = chaveReserva(dataTexto, horario);

    return (
      reservas[chave] || {
        id: "",
        arena_id: "",
        data: dataTexto,
        horario,
        origem: "",
        cliente: "",
        telefone: "",
        valor: "",
        status: "Livre",
        tipo: "Avulso",
        grupoFixo: "",
      }
    );
  }

function normalizarReservaParaBanco(reserva) {
  return {
    cliente: reserva.cliente || "",
    telefone: reserva.telefone || "",
    data: reserva.data,
    horario: reserva.horario,
    valor: Number(reserva.valor || 0),
    status: reserva.status || "Livre",
    tipo: reserva.tipo || "Avulso",
    origem: reserva.origem || obterOrigemReserva(reserva.tipo),
    grupo_fixo: reserva.grupo_fixo || reserva.grupoFixo || "",
    arena_id: arenaAtualId,
  };
}

async function salvarReservaBanco(reserva) {
  if (!arenaAtualId) {
    return { message: "Contexto da arena nao carregado." };
  }

  const reservaComArena = normalizarReservaParaBanco(reserva);

  const { error } = await supabase
    .from("reservas")
    .upsert(reservaComArena, {
      onConflict: "arena_id,data,horario",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao salvar reserva:", error);
  }

  return error;
}

async function atualizarReservaBancoPorHorario(dataTexto, horario, campos) {
  if (!arenaAtualId) {
    return {
      data: null,
      error: { message: "Contexto da arena nao carregado." },
    };
  }

  const { data, error } = await supabase
    .from("reservas")
    .update(campos)
    .eq("arena_id", arenaAtualId)
    .eq("data", dataTexto)
    .eq("horario", horario)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao atualizar reserva existente:", error);
  }

  return { data, error };
}

async function atualizarReservaBancoPorId(id, campos) {
  if (!arenaAtualId) {
    return {
      data: null,
      error: { message: "Contexto da arena nao carregado." },
    };
  }

  const { data, error } = await supabase
    .from("reservas")
    .update(campos)
    .eq("id", id)
    .eq("arena_id", arenaAtualId)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao atualizar reserva por notificação:", error);
  }

  return { data, error };
}

function aplicarReservaAtualizadaNoEstado(reservaAtualizada) {
  if (!reservaAtualizada?.data || !reservaAtualizada?.horario) return;

  const chave = chaveReserva(reservaAtualizada.data, reservaAtualizada.horario);

  setReservas((anterior) => ({
    ...anterior,
    [chave]: {
      id: reservaAtualizada.id || "",
      arena_id: reservaAtualizada.arena_id || arenaAtualId,
      data: reservaAtualizada.data || "",
      horario: reservaAtualizada.horario || "",
      origem: reservaAtualizada.origem || "",
      cliente: reservaAtualizada.cliente || "",
      telefone: reservaAtualizada.telefone || "",
      valor: reservaAtualizada.valor || "",
      status: reservaAtualizada.status || "Livre",
      tipo: reservaAtualizada.tipo || "Avulso",
      grupoFixo: reservaAtualizada.grupo_fixo || "",
    },
  }));
  setReservasArenaId(arenaAtualId);
}

function removerReservaDasCentrais(id) {
  setNotificacoesPendentes((anteriores) =>
    anteriores.filter((item) => item.id !== id)
  );
  setPendenciasPagamento((anteriores) =>
    anteriores.filter((item) => item.id !== id)
  );
}

async function alterarStatusNotificacao(reserva, status) {
  if (!reserva?.id) {
    alert("Não foi possível localizar a reserva pendente.");
    return;
  }

  const { data: reservaAtualizada, error } = await atualizarReservaBancoPorId(
    reserva.id,
    {
      status,
      tipo: "Avulso",
    }
  );

  if (error) {
    alert(
      `Não foi possível atualizar a solicitação: ${
        error.message || "erro desconhecido"
      }`
    );
    return;
  }

  aplicarReservaAtualizadaNoEstado(reservaAtualizada);
  removerReservaDasCentrais(reserva.id);
}

async function confirmarNotificacao(reserva) {
  await alterarStatusNotificacao(reserva, "Reservado");
}

async function recusarNotificacao(reserva) {
  await alterarStatusNotificacao(reserva, "Cancelado");
}

async function criarOuAtualizarClientePublico({ nome, telefone }) {
  if (!arenaAtualId) return null;

  const { data, error } = await supabase.rpc(
    "criar_ou_atualizar_cliente_publico",
    {
      p_arena_id: arenaAtualId,
      p_nome: nome,
      p_telefone: telefone,
    }
  );

  if (error) {
    console.warn(
      "Não foi possível criar/atualizar cliente público. A reserva continuará normalmente:",
      error
    );
    return null;
  }

  return data || null;
}

async function marcarPagamentoComoPago(reserva) {
  if (!reserva?.id) {
    alert("Não foi possível localizar a reserva.");
    return;
  }

  const { data: reservaAtualizada, error } = await atualizarReservaBancoPorId(
    reserva.id,
    {
      status: "Pago",
    }
  );

  if (error) {
    alert(
      `Não foi possível marcar como pago: ${
        error.message || "erro desconhecido"
      }`
    );
    return;
  }

  aplicarReservaAtualizadaNoEstado(reservaAtualizada);
  removerReservaDasCentrais(reserva.id);
}

function irParaReserva(reserva) {
  if (!reserva?.data) return;

  alterarData(reserva.data);
}

async function solicitarReservaPublica(dataTexto, horario, dadosCliente) {
  if (!arenaAtualId) {
    return {
      ok: false,
      mensagem: "Nao foi possivel carregar a arena. Tente novamente.",
    };
  }

  const nome = dadosCliente.nome.trim();
  const telefone = normalizarTelefone(dadosCliente.telefone);

  if (nome.length < 3) {
    return {
      ok: false,
      mensagem: "Informe um nome com pelo menos 3 caracteres.",
    };
  }

  if (telefone.length < 10) {
    return {
      ok: false,
      mensagem: "Informe um telefone/WhatsApp com pelo menos 10 digitos.",
    };
  }

  const { data: horariosOcupados, error: erroBuscaReserva } =
    await buscarHorariosOcupadosPublicos(dataTexto, dataTexto);

  if (erroBuscaReserva) {
    console.error("Erro ao verificar horario publico:", erroBuscaReserva);
    return {
      ok: false,
      mensagem:
        "Nao foi possivel verificar se o horario esta livre. Tente novamente.",
    };
  }

  const reservaExistente = (horariosOcupados || []).find(
    (item) => item.data === dataTexto && item.horario === horario
  );

  if (reservaTemOcupacao(reservaExistente)) {
    return {
      ok: false,
      mensagem: "Esse horario acabou de ser reservado. Escolha outro horario.",
    };
  }

  const telefoneArenaNormalizado = obterWhatsappArena(contextoArena.arenaAtual);

  if (!telefoneArenaNormalizado) {
    return {
      ok: false,
      mensagem: "WhatsApp da arena não configurado. Fale com o administrador.",
    };
  }

  const reservaPublica = {
    cliente: nome,
    telefone,
    data: dataTexto,
    horario,
    valor: 0,
    status: "Pendente",
    tipo: "Avulso",
    origem: "Publica",
    grupo_fixo: "",
    arena_id: arenaAtualId,
  };

  await criarOuAtualizarClientePublico({
    nome,
    telefone,
  });

  const { error: erroInsert } = await supabase
    .from("reservas")
    .insert(reservaPublica);

  if (erroInsert) {
    console.error("Erro ao criar reserva publica:", erroInsert);
    return {
      ok: false,
      mensagem:
        erroInsert.code === "23505"
          ? "Esse horario acabou de ser reservado. Escolha outro horario."
          : `Nao foi possivel enviar a solicitacao: ${
              erroInsert.message || "erro desconhecido"
            }`,
    };
  }

  setReservas((anterior) => ({
    ...anterior,
    [chaveReserva(dataTexto, horario)]: {
      id: "",
      arena_id: arenaAtualId,
      data: dataTexto,
      horario,
      origem: "Publica",
      cliente: nome,
      telefone,
      valor: "",
      status: "Pendente",
      tipo: "Avulso",
      grupoFixo: "",
    },
  }));
  setReservasArenaId(arenaAtualId);

  await notificarGestorNovaReserva({
    arena: contextoArena.arenaAtual,
    reserva: {
      ...reservaPublica,
      data: dataTexto,
      horario,
      status: "Pendente",
    },
    cliente: {
      nome,
      telefone,
    },
  });

  return {
    ok: true,
    mensagem: "Reserva pendente criada com sucesso.",
    whatsappUrl: criarLinkWhatsAppSolicitacao({
      nome,
      telefone,
      dataFormatada: formatarDataBR(dataTexto),
      horario,
      whatsappArena: telefoneArenaNormalizado,
    }),
  };
}

async function excluirReservaBanco(dataTexto, horario) {
  if (!arenaAtualId) {
    return { ok: false, error: { message: "Contexto da arena nao carregado." } };
  }

  const { data: existente, error: erroBusca } = await supabase
    .from("reservas")
    .select("*")
    .eq("arena_id", arenaAtualId)
    .eq("data", dataTexto)
    .eq("horario", horario);

  if (erroBusca) {
    console.error("Erro ao buscar reserva antes de excluir:", erroBusca);
    return { ok: false, error: erroBusca };
  }

  if (!existente || existente.length === 0) {
    return {
      ok: false,
      error: {
        message: "Reserva não encontrada antes do delete.",
      },
      reservaNaoEncontrada: true,
    };
  }

  const reservaEncontrada = existente[0];

  if (!reservaEncontrada.id) {
    return {
      ok: false,
      error: {
        message: "Reserva encontrada, mas sem id.",
      },
      reservaSemId: true,
    };
  }

  const { data: removida, error: erroDelete } = await supabase
    .from("reservas")
    .delete()
    .eq("id", reservaEncontrada.id)
    .select("*");

  if (erroDelete) {
    console.error("Erro ao excluir reserva:", erroDelete);
    return { ok: false, error: erroDelete };
  }

  if (!removida || removida.length === 0) {
    const { data: aindaExiste, error: erroVerificacao } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaEncontrada.id);

    if (erroVerificacao) {
      console.error("Erro na verificação pós-delete:", erroVerificacao);
      return { ok: false, error: erroVerificacao };
    }

    if (aindaExiste?.length) {
      return {
        ok: false,
        error: {
          message:
            "Reserva encontrada, mas o banco não permitiu remover. Verifique RLS/policy de DELETE.",
        },
        deleteBloqueado: true,
      };
    }

    return {
      ok: false,
      error: {
        message:
          "Nenhuma reserva foi removida no banco. Verifique arena_id, data e horário.",
      },
      nenhumRegistroRemovido: true,
    };
  }

  return { ok: true, data: removida };
}

  async function atualizarReserva(dataTexto, horario, campo, valor) {
  const chave = chaveReserva(dataTexto, horario);
  const reservaAnterior = pegarReserva(dataTexto, horario);
  const proximaReserva = {
    ...reservaAnterior,
    [campo]: valor,
  };

  setReservas((anterior) => ({
    ...anterior,
    [chave]: proximaReserva,
  }));

  const reservaAtual = {
    cliente: proximaReserva.cliente || "",
    telefone: proximaReserva.telefone || "",
    data: dataTexto,
    horario,
    valor: Number(proximaReserva.valor || 0),
    status: proximaReserva.status || "Livre",
    tipo: proximaReserva.tipo || "Avulso",
    grupo_fixo: proximaReserva.grupoFixo || "",
  };

  const error = await salvarReservaBanco(reservaAtual);

  if (error) {
    setReservas((anterior) => ({
      ...anterior,
      [chave]: reservaAnterior,
    }));

    alert(
      `Não foi possível salvar a reserva: ${error.message || "erro desconhecido"}`
    );
  }
}
async function limparReserva(dataTexto, horario) {
  const chave = chaveReserva(dataTexto, horario);
  const resultado = await excluirReservaBanco(dataTexto, horario);

  if (!resultado.ok) {
    alert(
      resultado.error?.message
        ? resultado.error.message
        : "Não foi possível limpar a reserva. Tente novamente."
    );
    return;
  }

  setReservas((anterior) => {
  const copia = { ...anterior };

  delete copia[chave];

  return copia;
});
}

  async function copiarFixosProximaSemana() {
  const quantidade = prompt("Por quantas semanas deseja repetir os horários fixos?", "4");

  if (!quantidade) return;

  const semanas = Number(quantidade);

  if (!semanas || semanas < 1) {
    alert("Informe uma quantidade válida de semanas.");
    return;
  }

  const confirmar = confirm(
    `Copiar todos os horários fixos por ${semanas} semana(s)?`
  );

  if (!confirmar) return;

  const novasReservas = {};

  Object.entries(reservasDaArenaAtual).forEach(([chave, reserva]) => {
    if (reserva.tipo !== "Fixo") return;

    const [dataTexto, horario] = chave.split("_");

    for (let i = 1; i <= semanas; i++) {
      const novaData = new Date(dataTexto + "T00:00:00");
      novaData.setDate(novaData.getDate() + 7 * i);

      const novaDataTexto = formatarData(novaData);
      const novaChave = `${novaDataTexto}_${horario}`;

      const grupoFixo =
  reserva.grupoFixo ||
  `${reserva.cliente}-${horario}`;
  reserva.grupoFixo = grupoFixo;

      const chaveOriginal = `${dataTexto}_${horario}`;

novasReservas[chaveOriginal] = {
  ...reserva,
  grupoFixo,
};

novasReservas[novaChave] = {
  ...reserva,
  status: "Reservado",
  tipo: "Fixo",
  grupoFixo,
};
      

      salvarReservaBanco({
        cliente: reserva.cliente || "",
        telefone: reserva.telefone || "",
        data: novaDataTexto,
        horario,
        valor: Number(reserva.valor || 0),
        status: "Reservado",
        tipo: "Fixo",
        grupo_fixo: grupoFixo,
      });
    }
  });

  setReservas((anterior) => ({
    ...anterior,
    ...novasReservas,
  }));

  alert(`Horários fixos copiados por ${semanas} semana(s).`);
}



  const reservasDaArenaAtual =
    reservasArenaId === arenaAtualId ? reservas : {};
  const resumo = useResumoReservas(reservasDaArenaAtual, mesFiltro);
  const resumoFinanceiro = {
    ...resumo,
    totalMensalistas: totalMensalistasPago,
    totalGeral: Number(resumo.faturamentoMes || 0) + totalMensalistasPago,
  };
  const onboardingRefreshKey = [
    arenaAtualId || "",
    Object.keys(reservasDaArenaAtual).length,
    versaoHorariosMensalistas,
  ].join(":");
  
  const { clientes, clientesFiltrados } = useClientes(
    resumo.lista,
    buscaCliente,
    filtroCliente
  );

  function corStatus(status) {
    if (status === "Pago") return "#166534";
if (status === "Pendente") return "#b45309";
if (status === "Reservado") return "#1d4ed8";
if (status === "Cancelado") return "#6b7280";

return "#14532d"; 
  }

  async function reservarHorario(dataTexto, horario) {
  const reserva = pegarReserva(dataTexto, horario);

  if (!reserva.cliente || reserva.cliente.trim() === "") {
    alert("Informe o nome do cliente/time antes de reservar.");
    return;
  }

  const tipo = reserva.tipo || "Avulso";
  const status =
    reserva.status === "Livre" || reserva.status === "Pendente"
      ? "Reservado"
      : reserva.status;

  if (tipo !== "Fixo") {
    const novaReserva = {
      ...reserva,
      status,
      tipo,
    };

    if (reserva.status === "Pendente") {
      const { data: reservaAtualizada, error } =
        await atualizarReservaBancoPorHorario(dataTexto, horario, {
          status: "Reservado",
          tipo: "Avulso",
        });

      if (error) {
        alert(
          `Não foi possível confirmar a reserva: ${
            error.message || "erro desconhecido"
          }`
        );
        return;
      }

      aplicarReservaAtualizadaNoEstado(reservaAtualizada);
      removerReservaDasCentrais(reservaAtualizada.id);

      alert("Reserva confirmada!");
      return;
    }

    const error = await salvarReservaBanco({
      cliente: reserva.cliente || "",
      telefone: reserva.telefone || "",
      data: dataTexto,
      horario,
      valor: Number(reserva.valor || 0),
      status,
      tipo,
      grupo_fixo: reserva.grupoFixo || "",
    });

    if (error) {
      alert(
        `Não foi possível reservar o horário: ${
          error.message || "erro desconhecido"
        }`
      );
      return;
    }

    setReservas((anterior) => ({
      ...anterior,
      [chaveReserva(dataTexto, horario)]: novaReserva,
    }));

    alert("Horário reservado.");
    return;
  }

  const quantidade = prompt("Por quantas semanas deseja repetir este horário fixo?", "24");

  if (!quantidade) return;

  const semanas = Number(quantidade);

  if (!semanas || semanas < 1) {
    alert("Informe uma quantidade válida de semanas.");
    return;
  }

  const confirmar = confirm(
    `Reservar este horário fixo por ${semanas} semana(s)?`
  );

  if (!confirmar) return;

  const grupoFixo =
    reserva.grupoFixo ||
    `${reserva.cliente}-${horario}`;

  const novasReservas = {};

  for (let i = 0; i < semanas; i++) {
    const novaData = new Date(dataTexto + "T00:00:00");
    novaData.setDate(novaData.getDate() + 7 * i);

    const novaDataTexto = formatarData(novaData);
    const novaChave = chaveReserva(novaDataTexto, horario);

    novasReservas[novaChave] = {
      ...reserva,
      status: "Reservado",
      tipo: "Fixo",
      grupoFixo,
    };

    await salvarReservaBanco({
      cliente: reserva.cliente || "",
      telefone: reserva.telefone || "",
      data: novaDataTexto,
      horario,
      valor: Number(reserva.valor || 0),
      status: "Reservado",
      tipo: "Fixo",
      grupo_fixo: grupoFixo,
    });
  }

  setReservas((anterior) => ({
    ...anterior,
    ...novasReservas,
  }));

  alert(`Horário fixo reservado por ${semanas} semana(s).`);
}

  async function alugarMensalistaComoAvulso(dataTexto, horario, dadosReserva) {
  const reservaAtual = pegarReserva(dataTexto, horario);
  const temReservaReal =
    reservaAtual.status !== "Livre" ||
    (reservaAtual.tipo && reservaAtual.tipo !== "Avulso") ||
    Boolean(reservaAtual.cliente?.trim()) ||
    Boolean(reservaAtual.telefone?.trim()) ||
    Number(reservaAtual.valor || 0) > 0;

  if (temReservaReal) {
    return "Este horário já possui uma reserva.";
  }

  const novaReserva = {
    cliente: dadosReserva.cliente.trim(),
    telefone: dadosReserva.telefone.trim(),
    data: dataTexto,
    horario,
    valor: Number(dadosReserva.valor || 0),
    status: dadosReserva.status || "Reservado",
    tipo: "Avulso",
  };

  const error = await salvarReservaBanco(novaReserva);

  if (error) {
    return "Não foi possível alugar este horário como avulso. Tente novamente.";
  }

  setReservas((anterior) => ({
    ...anterior,
    [chaveReserva(dataTexto, horario)]: {
      cliente: novaReserva.cliente,
      telefone: novaReserva.telefone,
      valor: novaReserva.valor,
      status: novaReserva.status,
      tipo: "Avulso",
    },
  }));

  return "";
}

  const permissoesLogado = perfilLogado
    ? PERFIS_PERMISSOES[perfilLogado]
    : null;

  async function entrarComEmailSenha({ email, senha }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: senha,
    });

    if (error) {
      console.error("Erro ao fazer login:", error);
      return "E-mail ou senha invalidos.";
    }

    setSessaoAuth(data.session);
    setPerfilLogado(obterPerfilDaSessao(data.session));
    setMostrarLogin(false);
    irParaRaiz(setPathname, { replace: true });

    return "";
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  if (authCarregando) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-label="Carregando sessão">
          <div className="login-brand">
            <h1>ArenaBase</h1>
            <p>Carregando sessão...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!sessaoAuth && (mostrarLogin || rotaLogin)) {
    return (
      <Login
        onEntrar={entrarComEmailSenha}
        onVoltar={() => setMostrarLogin(false)}
      />
    );
  }

  if (!sessaoAuth && !temRotaPublicaSlug) {
    return <BuscaArenasPublica onEntrar={() => setMostrarLogin(true)} />;
  }

  if (temRotaPublicaSlug && contextoArena.carregandoContexto) {
    return <PaginaPublicaCarregando />;
  }

  if (
    temRotaPublicaSlug &&
    (contextoArena.erroContexto || !contextoArena.arenaAtual)
  ) {
    return <ArenaPublicaIndisponivel onVoltar={() => irParaRaiz(setPathname)} />;
  }

  if (sessaoOperacional && contextoArena.carregandoContexto) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-label="Carregando contexto">
          <div className="login-brand">
            <h1>ArenaBase</h1>
            <p>Carregando contexto da arena...</p>
          </div>
        </section>
      </main>
    );
  }

  if (
    sessaoOperacional &&
    (contextoArena.erroContexto ||
      !contextoArena.usuarioAtual ||
      !contextoArena.arenaAtual)
  ) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-label="Erro de contexto">
          <div className="login-brand">
            <h1>ArenaBase</h1>
            <p>
              {contextoArena.erroContexto ||
                "Nao foi possivel carregar o contexto da arena."}
            </p>
          </div>
          <button className="login-button" type="button" onClick={sair}>
            Sair
          </button>
        </section>
      </main>
    );
  }

  return (
    <Home
      perfilLogado={perfilLogado}
      permissoesLogado={permissoesLogado}
      contextoArena={contextoArena}
      onSair={sair}
      onEntrar={() => setMostrarLogin(true)}
      modoPublico={!sessaoOperacional}
      dataBase={dataBase}
      mesFiltro={mesFiltro}
      dias={dias}
      horarios={horarios}
      diasSemana={diasSemana}
      tipoLista={tipoLista}
      statusLista={statusLista}
      horariosMensalistas={horariosMensalistas}
      onMensalistasChange={recarregarHorariosMensalistas}
      onboardingRefreshKey={onboardingRefreshKey}
      resumo={resumoFinanceiro}
      clientes={clientes}
      clientesFiltrados={clientesFiltrados}
      buscaCliente={buscaCliente}
      filtroCliente={filtroCliente}
      clienteSelecionado={clienteSelecionado}
      formatarData={formatarData}
      formatarDataBR={formatarDataBR}
      moeda={moeda}
      pegarReserva={pegarReserva}
      atualizarReserva={atualizarReserva}
      reservarHorario={reservarHorario}
      alugarMensalistaComoAvulso={alugarMensalistaComoAvulso}
      solicitarReservaPublica={solicitarReservaPublica}
      limparReserva={limparReserva}
      notificacoesPendentes={notificacoesPendentes}
      pendenciasPagamento={pendenciasPagamento}
      onConfirmarNotificacao={confirmarNotificacao}
      onRecusarNotificacao={recusarNotificacao}
      onMarcarPagamentoPago={marcarPagamentoComoPago}
      onIrParaReserva={irParaReserva}
      mudarSemana={mudarSemana}
      alterarData={alterarData}
      copiarFixosProximaSemana={copiarFixosProximaSemana}
      setMesFiltro={setMesFiltro}
      setBuscaCliente={setBuscaCliente}
      setFiltroCliente={setFiltroCliente}
      setClienteSelecionado={setClienteSelecionado}
    />
  );
}

function obterSlugPublico(pathname) {
  const partes = String(pathname || "")
    .split("/")
    .map((parte) => parte.trim())
    .filter(Boolean);

  if (partes.length !== 1) return "";

  const [slug] = partes;
  const rotasInternas = new Set([
    "agenda",
    "clientes",
    "financeiro",
    "login",
    "mensalistas",
  ]);

  return rotasInternas.has(slug) ? "" : slug;
}

function normalizarPathname(pathname) {
  const caminho = String(pathname || "/").trim() || "/";
  return caminho.endsWith("/") && caminho.length > 1
    ? caminho.slice(0, -1)
    : caminho;
}

function irParaRaiz(setPathname, opcoes = {}) {
  const metodoHistorico = opcoes.replace ? "replaceState" : "pushState";
  window.history[metodoHistorico]({}, "", "/");
  setPathname("/");
}

function PaginaPublicaCarregando() {
  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Carregando agenda pública">
        <div className="login-brand">
          <h1>ArenaBase</h1>
          <p>Carregando horários...</p>
        </div>
      </section>
    </main>
  );
}

function ArenaPublicaIndisponivel({ onVoltar }) {
  useEffect(() => {
    document.title = "Arena não encontrada | ArenaBase";
  }, []);

  return (
    <main className="public-not-found-page">
      <section className="public-not-found-card">
        <strong>ArenaBase</strong>
        <h1>Arena não encontrada ou indisponível.</h1>
        <p>Confira o link ou busque uma arena disponível.</p>
        <button type="button" onClick={onVoltar}>
          Buscar arenas
        </button>
      </section>
    </main>
  );
}

const horarioStyle = {
  background: "#e2e8f0",
  color: "#0f172a",
  padding: "10px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "14px",
};

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function normalizarTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "");
}

function reservaTemOcupacao(reserva) {
  if (!reserva) return false;

  return (
    reserva.ocupado === true ||
    reserva.status !== "Livre" ||
    (reserva.tipo && reserva.tipo !== "Avulso") ||
    Boolean(reserva.cliente?.trim()) ||
    Boolean(reserva.telefone?.trim()) ||
    Number(reserva.valor || 0) > 0
  );
}

function erroRecursoPublicoInexistente(error) {
  const mensagem = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  return (
    mensagem.includes("agenda_publica_horarios_ocupados") ||
    mensagem.includes("does not exist") ||
    mensagem.includes("could not find") ||
    mensagem.includes("pgrst202") ||
    mensagem.includes("42p01")
  );
}

function expandirHorariosMensalistasPublicos(horariosContratados, inicio, fim) {
  const datas = listarDatasNoPeriodo(inicio, fim);

  return horariosContratados.flatMap((horarioContratado) =>
    datas
      .filter((data) => data.getDay() === Number(horarioContratado.dia_semana))
      .map((data) => ({
        arena_id: horarioContratado.arena_id,
        data: formatarDataLocal(data),
        horario: horarioContratado.horario,
        ocupado: true,
        status_publico: "Ocupado",
      }))
  );
}

function listarDatasNoPeriodo(inicio, fim) {
  const datas = [];
  const cursor = criarDataLocal(inicio);
  const dataFim = criarDataLocal(fim);

  while (cursor <= dataFim) {
    datas.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
}

function criarDataLocal(dataTexto) {
  const [ano, mes, dia] = String(dataTexto).split("-").map(Number);

  return new Date(ano, mes - 1, dia);
}

function ehSolicitacaoAgendamento(reserva) {
  return (
    reserva?.status === "Pendente" &&
    reserva?.origem === "Publica"
  );
}

function ehPendenciaPagamento(reserva) {
  const statusPendentePagamento =
    reserva?.status === "Reservado" || reserva?.status === "Pendente";

  return (
    statusPendentePagamento &&
    Number(reserva.valor || 0) > 0 &&
    reserva?.origem !== "Publica" &&
    String(reserva.data || "") <= obterDataHojeTexto()
  );
}

function obterDataHojeTexto() {
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  return formatarDataLocal(hoje);
}

function obterOrigemReserva(tipo) {
  if (tipo === "Fixo") return "Fixo";
  if (tipo === "Mensalista") return "Mensalista";

  return "Manual";
}

function criarLinkWhatsAppSolicitacao({
  nome,
  telefone,
  dataFormatada,
  horario,
  whatsappArena,
}) {
  const mensagem = [
    "Olá! Nova solicitação de reserva pela agenda online.",
    "",
    `Nome: ${nome}`,
    `Telefone: ${telefone}`,
    `Data: ${dataFormatada}`,
    `Horário: ${horario}`,
    "Status: Pendente",
    "",
    "Por favor, confirme a disponibilidade.",
  ].join("\n");
  const url = `https://wa.me/${whatsappArena}?text=${encodeURIComponent(
    mensagem
  )}`;

  console.log("URL WhatsApp arena:", url);

  return url;
}

function obterWhatsappArena(arenaAtual) {
  const telefoneBruto = arenaAtual?.whatsapp || arenaAtual?.telefone || "";
  const whatsapp = formatarTelefoneWhatsApp(telefoneBruto);

  console.log("WhatsApp arena bruto:", telefoneBruto);
  console.log("WhatsApp arena normalizado:", whatsapp);

  if (!whatsapp) {
    console.warn("WhatsApp da arena inválido ou vazio:", telefoneBruto);
  }

  return whatsapp;
}

function formatarTelefoneWhatsApp(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");

  if (digitos.length < 10) return "";
  if (digitos.startsWith("55")) return digitos;

  return `55${digitos}`;
}
