import { useEffect, useState } from "react";
import { diasSemana, horarios, statusLista, tipoLista } from "./constants";
import { useAgendaSemana } from "./hooks/useAgendaSemana";
import { useClientes } from "./hooks/useClientes";
import { useResumoReservas } from "./hooks/useResumoReservas";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import { supabase } from "./supabase";  
import { formatarData, formatarDataBR, moeda } from "./utils";

const STORAGE_KEY = "arena-manasses-reservas-v2";
const PERFIL_PADRAO = "Funcionário";
const PERFIS_PERMISSOES = {
  Administrador: {
    podeLimparPago: true,
    podeEditarTudo: true,
  },
  Funcionário: {
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
  const [perfilLogado, setPerfilLogado] = useState(null);
  const { dataBase, dias, mudarSemana, alterarData } = useAgendaSemana();
  const [mesFiltro, setMesFiltro] = useState(() => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
});

  const [reservas, setReservas] = useState(() => {
    const salvas = localStorage.getItem(STORAGE_KEY);

    return salvas ? JSON.parse(salvas) : {};
  });
  const [totalMensalistasPago, setTotalMensalistasPago] = useState(0);
  const [horariosMensalistas, setHorariosMensalistas] = useState({});
  const [versaoHorariosMensalistas, setVersaoHorariosMensalistas] = useState(0);

  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  useEffect(() => {
  let ativo = true;

  async function carregarSessao() {
    const { data } = await supabase.auth.getSession();

    if (!ativo) return;

    setSessaoAuth(data.session);
    setPerfilLogado(obterPerfilDaSessao(data.session));
    setAuthCarregando(false);
  }

  carregarSessao();

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!ativo) return;

    setSessaoAuth(session);
    setPerfilLogado(obterPerfilDaSessao(session));
    setAuthCarregando(false);
  });

  return () => {
    ativo = false;
    data.subscription.unsubscribe();
  };
}, []);

  useEffect(() => {
  async function carregarReservas() {
    const { data, error } = await supabase
      .from("reservas")
      .select("*");

    if (error) {
      console.log("Erro ao carregar reservas:", error);
      return;
    }

    const reservasFormatadas = {};

    data.forEach((reserva) => {
      const chave = `${reserva.data}_${reserva.horario}`;

      reservasFormatadas[chave] = {
  cliente: reserva.cliente || "",
  telefone: reserva.telefone || "",
  valor: reserva.valor || "",
  status: reserva.status || "Livre",
  tipo: reserva.tipo || "Avulso",
};
    });

    setReservas(reservasFormatadas);
  }

  carregarReservas();
}, []);

  useEffect(() => {
  if (!sessaoAuth) {
    setTotalMensalistasPago(0);
    return;
  }

  let ativo = true;

  async function carregarTotalMensalistasPago() {
    const [
      { data: mensalistasData, error: mensalistasError },
      { data, error },
    ] = await Promise.all([
      supabase.from("mensalistas").select("id"),
      supabase
        .from("mensalista_pagamentos")
        .select("id,mensalista_id,competencia,valor,situacao")
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
}, [sessaoAuth, mesFiltro, versaoHorariosMensalistas]);

  useEffect(() => {
  if (!sessaoAuth) {
    setHorariosMensalistas({});
    return;
  }

  let ativo = true;

  async function carregarHorariosMensalistas() {
    const { data: mensalistasData, error: mensalistasError } = await supabase
      .from("mensalistas")
      .select("id,nome,status")
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
}, [sessaoAuth, versaoHorariosMensalistas]);

  function recarregarHorariosMensalistas() {
    setVersaoHorariosMensalistas((versao) => versao + 1);
  }

  function chaveReserva(dataTexto, horario) {
    return `${dataTexto}_${horario}`;
  }

  function pegarReserva(dataTexto, horario) {
    const chave = chaveReserva(dataTexto, horario);

    return (
  reservas[chave] || {
    cliente: "",
    telefone: "",
    valor: "",
    status: "Livre",
    tipo: "Avulso",
  }
);
  }
async function salvarReservaBanco(reserva) {
  const { error } = await supabase
    .from("reservas")
    .upsert([reserva], {
  onConflict: "data,horario",
});

  if (error) {
    console.log(error);
  }

  return error;
}
  function atualizarReserva(dataTexto, horario, campo, valor) {
  const chave = chaveReserva(dataTexto, horario);
  

  setReservas((anterior) => ({
    ...anterior,
    [chave]: {
      ...pegarReserva(dataTexto, horario),
      [campo]: valor,
    },
  }));

  const reservaAtual = {
    cliente: pegarReserva(dataTexto, horario).cliente || "",
    telefone: pegarReserva(dataTexto, horario).telefone || "",
    data: dataTexto,
    horario,
    valor: Number(pegarReserva(dataTexto, horario).valor || 0),
    status: pegarReserva(dataTexto, horario).status || "Livre",
    tipo: pegarReserva(dataTexto, horario).tipo || "Avulso",
  };

  reservaAtual[campo] = valor;

  salvarReservaBanco(reservaAtual);
}
function limparReserva(dataTexto, horario) {
console.log("CLICOU NO LIMPAR", dataTexto, horario);
  const chave = chaveReserva(dataTexto, horario);
  const reservaAtual = pegarReserva(dataTexto, horario);

  const reservaLimpa = {
  cliente: "",
  telefone: "",
  valor: "",
  status: "Livre",
  tipo: "Avulso",
};

  setReservas((anterior) => {
  const copia = { ...anterior };

  copia[chave] = reservaLimpa;

  if (reservaAtual.grupoFixo) {
    Object.keys(copia).forEach((itemChave) => {
      const item = copia[itemChave];

      if (item.grupoFixo === reservaAtual.grupoFixo) {
        copia[itemChave] = {
          cliente: "",
          telefone: "",
          valor: "",
          status: "Livre",
          tipo: "Avulso",
          grupoFixo: "",
        };
      }
    });
  }

  return copia;
});

  salvarReservaBanco({
  cliente: "",
  telefone: "",
  data: dataTexto,
  horario,
  valor: 0,
  status: "Livre",
  tipo: "Avulso",
});
}

  async function copiarFixosProximaSemana() {
  const quantidade = prompt("Quantas semanas deseja repetir os horários fixos?", "4");

  if (!quantidade) return;

  const semanas = Number(quantidade);

  if (!semanas || semanas < 1) {
    alert("Informe uma quantidade válida de semanas.");
    return;
  }

  const confirmar = confirm(
    `Copiar todos os horários FIXOS por ${semanas} semana(s)?`
  );

  if (!confirmar) return;

  const novasReservas = {};

  Object.entries(reservas).forEach(([chave, reserva]) => {
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

  alert(`Horários fixos copiados por ${semanas} semana(s)!`);
}



  const resumo = useResumoReservas(reservas, mesFiltro);
  const resumoFinanceiro = {
    ...resumo,
    totalMensalistas: totalMensalistasPago,
    totalGeral: Number(resumo.faturamentoMes || 0) + totalMensalistasPago,
  };
  
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
  const status = reserva.status === "Livre" ? "Reservado" : reserva.status;

  if (tipo !== "Fixo") {
    const novaReserva = {
      ...reserva,
      status,
      tipo,
    };

    setReservas((anterior) => ({
      ...anterior,
      [chaveReserva(dataTexto, horario)]: novaReserva,
    }));

    await salvarReservaBanco({
      cliente: reserva.cliente || "",
      telefone: reserva.telefone || "",
      data: dataTexto,
      horario,
      valor: Number(reserva.valor || 0),
      status,
      tipo,
      grupo_fixo: reserva.grupoFixo || "",
    });

    alert("Horário reservado!");
    return;
  }

  const quantidade = prompt("Quantas semanas deseja repetir este horário fixo?", "24");

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

  alert(`Horário fixo reservado por ${semanas} semana(s)!`);
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
    return "Este horÃ¡rio jÃ¡ possui uma reserva real.";
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
    return "NÃ£o foi possÃ­vel alugar este horÃ¡rio como avulso. Tente novamente.";
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      return "E-mail ou senha inválidos. Confira os dados e tente novamente.";
    }

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
            <h1>Arena do Manassés</h1>
            <p>Carregando sessão...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!sessaoAuth) {
    return (
      <LoginPage
        onEntrar={entrarComEmailSenha}
      />
    );
  }

  return (
    <Home
      perfilLogado={perfilLogado}
      permissoesLogado={permissoesLogado}
      onSair={sair}
      dataBase={dataBase}
      mesFiltro={mesFiltro}
      dias={dias}
      horarios={horarios}
      diasSemana={diasSemana}
      tipoLista={tipoLista}
      statusLista={statusLista}
      horariosMensalistas={horariosMensalistas}
      onMensalistasChange={recarregarHorariosMensalistas}
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
      limparReserva={limparReserva}
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

const horarioStyle = {
  background: "#e2e8f0",
  color: "#0f172a",
  padding: "10px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "14px",
};

