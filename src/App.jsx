import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";  
const horarios = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
  "21:00 - 22:00",
  "22:00 - 23:00",
  "23:00 - 00:00",
];

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const tipoLista = ["Avulso", "Fixo", "Mensalista"];

const statusLista = ["Livre", "Reservado", "Pago", "Pendente", "Cancelado", "Faltou"];

const STORAGE_KEY = "arena-manasses-reservas-v2";

function formatarData(data) {
  return data.toISOString().split("T")[0];
}

function formatarDataBR(dataTexto) {
  const [ano, mes, dia] = dataTexto.split("-");
  return `${dia}/${mes}/${ano}`;
}

function inicioDaSemana(data) {
  const nova = new Date(data);

  const dia = nova.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;

  nova.setDate(nova.getDate() + diff);
  nova.setHours(0, 0, 0, 0);

  return nova;
}

function gerarDiasDaSemana(dataBase) {
  const inicio = inicioDaSemana(dataBase);

  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(inicio);

    data.setDate(inicio.getDate() + i);

    return data;
  });
}

function moeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function numero(valor) {
  return Number(String(valor || "").replace(",", ".")) || 0;
}

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



  const resumo = useMemo(() => {
    const lista = Object.entries(reservas).map(([chave, reserva]) => {
      const [data, horario] = chave.split("_");

      return {
        data,
        horario,
        ...reserva,
        valorNumero: numero(reserva.valor),
      };
    });

    const [anoAtual, mesAtual] = mesFiltro.split("-").map(Number);

const listaMes = lista.filter((r) => {
  const data = new Date(r.data + "T00:00:00");

  return (
    data.getMonth() + 1 === mesAtual &&
    data.getFullYear() === anoAtual
  );
});

const faturamentoMes = listaMes
  .filter((r) => r.status === "Pago")
  .reduce((soma, r) => soma + r.valorNumero, 0);

const pendenteMes = listaMes
  .filter((r) => r.status === "Pendente")
  .reduce((soma, r) => soma + r.valorNumero, 0);
    const faturamento = lista
      .filter((r) => r.status === "Pago")
      .reduce((soma, r) => soma + r.valorNumero, 0);

    const pendente = lista
      .filter((r) => r.status === "Pendente")
      .reduce((soma, r) => soma + r.valorNumero, 0);

    const jogos = lista.filter(
  (r) =>
    r.cliente &&
    r.cliente.trim() !== "" &&
    ["Pago", "Pendente"].includes(r.status)
).length;

    const pagos = lista.filter((r) => r.status === "Pago").length;

    const reservados = lista.filter(
  (r) => r.status === "Reservado" && r.tipo !== "Fixo"
).length;

    return {
      faturamento,
      pendente,
      jogos,
      pagos,
      reservados,
      faturamentoMes,
      pendenteMes,
      lista,
    };
  }, [reservas]);
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

    mapa[nome].jogos += 1;

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
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "25px",
        fontFamily: "Arial",
      }}
    >
      <h1
       style={{
    textAlign: "center",
    fontSize: "46px",
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: "1px",
    textShadow: "0 0 18px rgba(34, 197, 94, 0.75)",
    marginBottom: "8px",
        }}
      >
        Arena do Manassés ⚽
      </h1>

      <p
        style={{
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        Agenda por datas reais
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "25px",
          flexWrap: "wrap",
          padding: "0 10px",
        }}
      >
        <button
          onClick={() => mudarSemana(-1)}
          style={botao}
        >
          ← Semana anterior
        </button>

        <input
          type="date"
          value={formatarData(dataBase)}
          onChange={(e) =>
            setDataBase(new Date(e.target.value + "T00:00:00"))
          }
          style={inputData}
        />
        <input
  type="month"
  value={mesFiltro}
  onChange={(e) => setMesFiltro(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "bold",
    marginTop: "10px",
  }}
/>

        <button
          onClick={() => mudarSemana(1)}
          style={botao}
        >
          Próxima semana →
        </button>
        <button
          onClick={copiarFixosProximaSemana}
          style={{
           ...botao,
           background: "#2563eb",
        }}
>
  Copiar fixos →
</button>
      </div>

      <div
        style={{
          display: "grid",
         gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "15px",
          marginTop: "30px",
        }}
      >
        <Card titulo="Faturamento" valor={moeda(resumo.faturamento)} />
        <Card titulo="Pendente" valor={moeda(resumo.pendente)} />
        <Card titulo="Jogos" valor={resumo.jogos} />
        <Card titulo="Pagos" valor={resumo.pagos} />
        <Card titulo="Reservados" valor={resumo.reservados} />
        <Card
  titulo="Mês Pago"
  valor={moeda(resumo.faturamentoMes)}
/>

<Card
  titulo="Mês Pendente"
  valor={moeda(resumo.pendenteMes)}
/>
      </div>

      <div
        style={{
          marginTop: "30px",
          overflowX: "auto",
          overflowY: "auto",
          scrollBehavior: "smooth",
          paddingBottom: "10px",
maxHeight: "70vh",
          background: "white",
          color: "#0f172a",
          borderRadius: "14px",
          padding: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
            gap: "10px",
            minWidth: "100%",
          }}
        >
          

          {dias.map((data) => {
            const textoData = formatarData(data);
const totalDia = horarios.reduce((total, horaAtual) => {
  const reserva = pegarReserva(textoData, horaAtual);

  if (reserva.status === "Pago") {
    return total + Number(reserva.valor || 0);
  }

  return total;
}, 0);
const jogosDia = horarios.filter((horaAtual) => {
  const reserva = pegarReserva(textoData, horaAtual);

  return (
  reserva.cliente &&
  reserva.cliente.trim() !== "" &&
  ["Pago", "Pendente"].includes(reserva.status)
);
}).length;
            return (
              <div key={textoData} style={cabecalho}>
                <div>{diasSemana[data.getDay()]}</div>
<div style={{ marginTop: "4px", fontSize: "12px" }}>
  {formatarDataBR(textoData)}
</div>

<div
  style={{
    marginTop: "4px",
    fontWeight: "bold",
    color: "#86efac",
    fontSize: "12px",
lineHeight: "14px",
wordBreak: "break-word",
  }}
>
  {moeda(totalDia)}
  <div style={{ fontSize: "11px", marginTop: "2px" }}>
  {jogosDia} jogos
</div>
</div>
              </div>  
            );
          })}

          {horarios.map((hora) => (
            <>
              

              {dias.map((data) => {
                const dataTexto = formatarData(data);

                const item = pegarReserva(dataTexto, hora);
const totalDia = horarios.reduce((total, horaAtual) => {
  const reserva = pegarReserva(dataTexto, horaAtual);

  if (reserva.status === "Pago") {
    return total + Number(reserva.valor || 0);
  }

  return total;
}, 0);
                return (
                  <div
                    key={`${dataTexto}-${hora}`}
                    style={{
                      background:
  item.status === "Pago"
    ? "#dcfce7"
    : item.status === "Pendente"
    ? "#fef9c3"
    : item.status === "Cancelado"
    ? "#fee2e2"
    : item.status === "Faltou"
? "#e5e7eb"
    : "white",

opacity: item.status === "Livre" ? 0.72 : 1,

transform:
  item.status === "Pago"
    ? "scale(1.02)"
    : item.status === "Livre"
    ? "scale(0.98)"
    : "scale(1)",

transition: "0.2s",
                      border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "16px",
  padding: "12px",
  boxShadow:
  item.status === "Livre"
    ? "0 4px 12px rgba(15, 23, 42, 0.08)"
    : "0 8px 20px rgba(15, 23, 42, 0.18)",
                    }}
                  >
                    <div
  style={{
    fontSize: "11px",
    fontWeight: "bold",
    color: "#475569",
    marginBottom: "4px",
  }}
>
  {hora.split(" - ")[0]}
  {item.tipo === "Mensalista" && (
  <div
    style={{
      fontSize: "10px",
      fontWeight: "bold",
      color: "#2563eb",
      marginBottom: "4px",
    }}
  >
    ⭐ Mensalista
  </div>
)}
{item.tipo === "Fixo" && (
  <div
    style={{
      fontSize: "10px",
      fontWeight: "bold",
      color: "#2563eb",
      marginBottom: "4px",
    }}
  >
    🔒 Fixo
  </div>
)}
</div>
                    <input
                      placeholder="cliente/Time"
                      value={item.cliente}
                      onChange={(e) =>
                        atualizarReserva(
                          dataTexto,
                          hora,
                          "cliente",
                          e.target.value
                        )
                      }
                      disabled={item.status === "Pago"}
                      style={inputStyle}
                    />

                    <input
                      placeholder="Telefone"
                      value={item.telefone}
                      maxLength={11}
                      onChange={(e) =>
                        atualizarReserva(
                          dataTexto,
                          hora,
                          "telefone",
                          e.target.value
                        )
                      }
                      disabled={item.status === "Pago"}
                      style={{
  ...inputStyle,
  fontSize: "12px",
}}
                    />

                    <input
                      placeholder="Valor"
                      type="number"
                      value={item.valor}
                      onChange={(e) =>
                        atualizarReserva(
                          dataTexto,
                          hora,
                          "valor",
                          e.target.value
                        )
                      }
                      disabled={item.status === "Pago"}
                      style={inputStyle}
                    />

                    <select
  value={item.tipo || "Avulso"}
  onChange={(e) =>
    atualizarReserva(
      dataTexto,
      hora,
      "tipo",
      e.target.value
    )
  }
  disabled={item.status === "Pago"}
  style={inputStyle}
>
  {tipoLista.map((tipo) => (
    <option key={tipo}>{tipo}</option>
  ))}
</select>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        atualizarReserva(
                          dataTexto,
                          hora,
                          "status",
                          e.target.value
                        )
                      }
                      disabled={item.status === "Pago"}
                      style={inputStyle}
                    >
                      {statusLista.map((status) => (
                        <option key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
  type="button"
  onClick={() => reservarHorario(dataTexto, hora)}
  style={{
    marginRight: "6px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "6px 8px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  Reservar
</button>

<button
  type="button"
  onClick={() => {
  if (item.status === "Pago") {
    alert("Horário pago não pode ser limpo sem autorização.");
    return;
  }

  const confirmar = confirm("Tem certeza que deseja limpar esta reserva?");

  if (confirmar) {
    limparReserva(dataTexto, hora);
  }
}}
>
  Limpar
</button>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
      <div
  style={{
    marginTop: "40px",
  }}
>
  <h2 style={{ marginBottom: "20px" }}>
    Clientes
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "15px",
    }}
  >
    {clientes.map((cliente) => (
      <div
        key={cliente.nome}
        style={{
          background: "#1e293b",
          borderRadius: "18px",
          padding: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h3>{cliente.nome}</h3>

        <p>{cliente.telefone || "Sem telefone"}</p>
        {cliente.telefone && (
  <a
    href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
    target="_blank"
    rel="noreferrer"
    style={{
      display: "inline-block",
      marginTop: "8px",
      padding: "8px 12px",
      borderRadius: "10px",
      background: "#22c55e",
      color: "white",
      textDecoration: "none",
      fontWeight: "bold",
      fontSize: "13px",
    }}
  >
    WhatsApp
  </a>
)}

        <p>Jogos: {cliente.jogos}</p>

        <p>Pago: {moeda(cliente.pago)}</p>

        <p>Pendente: {moeda(cliente.pendente)}</p>
      </div>
    ))}
  </div>
</div>  
    </div>
  );
}

function Card({ titulo, valor }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        padding: "22px",
        borderRadius: "22px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <p style={{ color: "#cbd5e1", fontSize: "18px", margin: 0 }}>
        {titulo}
      </p>

      <h2
  style={{
    fontSize: "32px",
    color: "white",
    margin: "10px 0 0",
    wordBreak: "break-word",
    lineHeight: "36px",
  }}
>
  {valor}
</h2>
    </div>
  );
}

const cabecalho = {
  background: "#020617",
  color: "white",
  padding: "10px 6px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "14px",
  position: "sticky",
  top: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
zIndex: 100,
};

const horarioStyle = {
  background: "#e2e8f0",
  color: "#0f172a",
  padding: "10px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  marginBottom: "5px",
  padding: "6px",
  borderRadius: "7px",
  border: "1px solid #94a3b8",
  fontSize: "12px",
  minHeight: "34px",
};

const botao = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputData = {
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "bold",
};