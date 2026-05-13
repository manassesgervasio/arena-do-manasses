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
const statusLista = ["Livre", "Reservado", "Pago", "Pendente", "Cancelado"];

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

  const [reservas, setReservas] = useState(() => {
    const salvas = localStorage.getItem(STORAGE_KEY);

    return salvas ? JSON.parse(salvas) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservas));
  }, [reservas]);

  const dias = useMemo(() => gerarDiasDaSemana(dataBase), [dataBase]);

  function chaveReserva(dataTexto, horario) {
    return `${dataTexto}_${horario}`;
  }

  function pegarReserva(dataTexto, horario) {
    const chave = chaveReserva(dataTexto, horario);

    return (
      reservas[chave] || {
        dono: "",
        telefone: "",
        valor: "",
        status: "Livre",
      }
    );
  }
async function salvarReservaBanco(reserva) {
  const { error } = await supabase
    .from("reservas")
    .insert([reserva]);

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
    cliente: pegarReserva(dataTexto, horario).dono || "",
    telefone: pegarReserva(dataTexto, horario).telefone || "",
    data: dataTexto,
    horario,
    valor: Number(pegarReserva(dataTexto, horario).valor || 0),
    status: pegarReserva(dataTexto, horario).status || "Livre",
  };

  reservaAtual[campo] = valor;

  salvarReservaBanco(reservaAtual);
}
  }

  function mudarSemana(qtd) {
    const nova = new Date(dataBase);

    nova.setDate(nova.getDate() + qtd * 7);

    setDataBase(nova);
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

    const faturamento = lista
      .filter((r) => r.status === "Pago")
      .reduce((soma, r) => soma + r.valorNumero, 0);

    const pendente = lista
      .filter((r) => r.status === "Pendente")
      .reduce((soma, r) => soma + r.valorNumero, 0);

    const jogos = lista.filter(
      (r) => r.dono && r.dono.trim() !== ""
    ).length;

    const pagos = lista.filter((r) => r.status === "Pago").length;

    const reservados = lista.filter(
      (r) => r.status === "Reservado"
    ).length;

    return {
      faturamento,
      pendente,
      jogos,
      pagos,
      reservados,
      lista,
    };
  }, [reservas]);

  function corStatus(status) {
    if (status === "Pago") return "#166534";
if (status === "Pendente") return "#b45309";
if (status === "Reservado") return "#1d4ed8";
if (status === "Cancelado") return "#6b7280";

return "#14532d"; 
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
          gap: "10px",
          marginTop: "25px",
          flexWrap: "wrap",
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

        <button
          onClick={() => mudarSemana(1)}
          style={botao}
        >
          Próxima semana →
        </button>
      </div>

      <div
        style={{
          display: "grid",
         gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginTop: "30px",
        }}
      >
        <Card titulo="Faturamento" valor={moeda(resumo.faturamento)} />
        <Card titulo="Pendente" valor={moeda(resumo.pendente)} />
        <Card titulo="Jogos" valor={resumo.jogos} />
        <Card titulo="Pagos" valor={resumo.pagos} />
        <Card titulo="Reservados" valor={resumo.reservados} />
      </div>

      <div
        style={{
          marginTop: "30px",
          overflowX: "auto",
          background: "white",
          color: "#0f172a",
          borderRadius: "20px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px repeat(7, minmax(210px, 1fr))",
            gap: "10px",
            minWidth: "1650px",
          }}
        >
          <div style={cabecalho}>Horário</div>

          {dias.map((data) => {
            const textoData = formatarData(data);

            return (
              <div key={textoData} style={cabecalho}>
                <div>{diasSemana[data.getDay()]}</div>

                <small>{formatarDataBR(textoData)}</small>
              </div>
            );
          })}

          {horarios.map((hora) => (
            <>
              <div key={hora} style={horarioStyle}>
                {hora}
              </div>

              {dias.map((data) => {
                const dataTexto = formatarData(data);

                const item = pegarReserva(dataTexto, hora);

                return (
                  <div
                    key={`${dataTexto}-${hora}`}
                    style={{
                      border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "16px",
  padding: "12px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.18)",
                    }}
                  >
                    <input
                      placeholder="Dono/Time"
                      value={item.dono}
                      onChange={(e) =>
                        atualizarReserva(
                          dataTexto,
                          hora,
                          "dono",
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    />

                    <input
                      placeholder="Telefone"
                      value={item.telefone}
                      onChange={(e) =>
                        atualizarReserva(
                          dataTexto,
                          hora,
                          "telefone",
                          e.target.value
                        )
                      }
                      style={inputStyle}
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
                      style={inputStyle}
                    />

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
                      style={inputStyle}
                    >
                      {statusLista.map((status) => (
                        <option key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </>
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

      <h2 style={{ fontSize: "34px", color: "white", margin: "10px 0 0" }}>
        {valor}
      </h2>
    </div>
  );
}

const cabecalho = {
  background: "#020617",
  color: "white",
  padding: "15px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "bold",
};

const horarioStyle = {
  background: "#e2e8f0",
  color: "#0f172a",
  padding: "15px",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  marginBottom: "8px",
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #94a3b8",
};

const botao = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const inputData = {
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "bold",
};