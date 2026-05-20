import { useEffect, useMemo, useState } from "react";
import AgendaGrid from "./components/AgendaGrid";
import AppHeader from "./components/AppHeader";
import ClientesSection from "./components/ClientesSection";
import ResumoCards from "./components/ResumoCards";
import WeekControls from "./components/WeekControls";
import { diasSemana, horarios, statusLista, tipoLista } from "./constants";
import { useResumoReservas } from "./hooks/useResumoReservas";
import { supabase } from "./supabase";  
import { formatarData, formatarDataBR, gerarDiasDaSemana, moeda } from "./utils";

const STORAGE_KEY = "arena-manasses-reservas-v2";

export default function App() {
  const [dataBase, setDataBase] = useState(new Date());
  const [mesFiltro, setMesFiltro] = useState(() => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
});

  const [reservas, setReservas] = useState(() => {
    const salvas = localStorage.getItem(STORAGE_KEY);

    return salvas ? JSON.parse(salvas) : {};
  });

  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

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

  const dias = useMemo(() => gerarDiasDaSemana(dataBase), [dataBase]);

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

  function mudarSemana(qtd) {
    const nova = new Date(dataBase);

    nova.setDate(nova.getDate() + qtd * 7);

    setDataBase(nova);
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
  
  const clientes = useMemo(() => {
  const mapa = {};

  resumo.lista.forEach((reserva) => {
    if (!reserva.cliente) return;

    const nome = reserva.cliente.trim();
    const telefone = reserva.telefone || "";

    if (!mapa[nome]) {
      mapa[nome] = {
        nome,
        telefone,
        jogos: 0,
        pago: 0,
        pendente: 0,
        ultimaReserva: reserva.data,
      };
    }

    if (reserva.status === "Pago") {
  mapa[nome].jogos += 1;
}

    if (reserva.status === "Pago") {
      mapa[nome].pago += reserva.valorNumero;
    }

    if (reserva.status === "Pendente") {
      mapa[nome].pendente += reserva.valorNumero;
    }

    mapa[nome].ultimaReserva = reserva.data;
  });

  return Object.values(mapa);
}, [resumo.lista]);

const clientesFiltrados = clientes
  .filter((cliente) => {
    const buscaOk = cliente.nome
      .toLowerCase()
      .includes(buscaCliente.toLowerCase());

    if (filtroCliente === "Ativos") {
      return buscaOk && cliente.jogos > 0;
    }

    if (filtroCliente === "Inadimplentes") {
      return buscaOk && cliente.pendente > 0;
    }

    return buscaOk;
  })
  .sort((a, b) => {
  if (b.pendente !== a.pendente) {
    return b.pendente - a.pendente;
  }

  if (b.jogos !== a.jogos) {
    return b.jogos - a.jogos;
  }

  return (
    new Date(b.ultimaReserva) -
    new Date(a.ultimaReserva)
  );
});

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
  return (
  <>
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "25px",
        fontFamily: "Arial",
      }}
    >
      <AppHeader />

      <WeekControls
        dataBase={dataBase}
        mesFiltro={mesFiltro}
        formatarData={formatarData}
        onSemanaAnterior={() => mudarSemana(-1)}
        onDataChange={(e) =>
          setDataBase(new Date(e.target.value + "T00:00:00"))
        }
        onMesFiltroChange={(e) => setMesFiltro(e.target.value)}
        onSemanaProxima={() => mudarSemana(1)}
        onCopiarFixos={copiarFixosProximaSemana}
      />

      <ResumoCards resumo={resumo} moeda={moeda} />

      <AgendaGrid
        dias={dias}
        horarios={horarios}
        diasSemana={diasSemana}
        tipoLista={tipoLista}
        statusLista={statusLista}
        formatarData={formatarData}
        formatarDataBR={formatarDataBR}
        moeda={moeda}
        pegarReserva={pegarReserva}
        atualizarReserva={atualizarReserva}
        reservarHorario={reservarHorario}
        limparReserva={limparReserva}
      />
      <ClientesSection
        clientes={clientes}
        clientesFiltrados={clientesFiltrados}
        buscaCliente={buscaCliente}
        filtroCliente={filtroCliente}
        moeda={moeda}
        formatarDataBR={formatarDataBR}
        clienteSelecionado={clienteSelecionado}
        onBuscaClienteChange={(e) => setBuscaCliente(e.target.value)}
        onFiltroClienteChange={(e) =>
          setFiltroCliente(e.target.value)
        }
        onClienteSelect={(cliente) =>
          setClienteSelecionado(cliente)
        }
        onClienteModalClose={() => setClienteSelecionado(null)}
      />
</div>
</>
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

