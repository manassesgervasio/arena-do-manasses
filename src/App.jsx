import { useEffect, useMemo, useState } from "react";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

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

function criarAgenda() {
  const agenda = {};

  dias.forEach((dia) => {
    agenda[dia] = {};

    horarios.forEach((hora) => {
      agenda[dia][hora] = {
        dono: "",
        valor: "",
        status: "Livre",
      };
    });
  });

  return agenda;
}

export default function App() {
const [agenda, setAgenda] = useState(() => {
  const dadosSalvos = localStorage.getItem("agenda-arena-manasses");

  if (dadosSalvos) {
    return JSON.parse(dadosSalvos);
  }

  return criarAgenda();
});

useEffect(() => {
  localStorage.setItem(
    "agenda-arena-manasses",
    JSON.stringify(agenda)
  );
}, [agenda]);  

  function atualizar(dia, hora, campo, valor) {
    setAgenda((anterior) => ({
      ...anterior,
      [dia]: {
        ...anterior[dia],
        [hora]: {
          ...anterior[dia][hora],
          [campo]: valor,
        },
      },
    }));
  }

  const resumo = useMemo(() => {
    let faturamento = 0;
    let pendente = 0;
    let jogos = 0;
    let pagos = 0;

    dias.forEach((dia) => {
      horarios.forEach((hora) => {
        const item = agenda[dia][hora];
        const valor = Number(item.valor) || 0;

        if (item.dono.trim() !== "") jogos++;

        if (item.status === "Pago") {
          faturamento += valor;
          pagos++;
        }

        if (item.status === "Pendente") {
          pendente += valor;
        }
      });
    });

    return { faturamento, pendente, jogos, pagos };
  }, [agenda]);

  function corStatus(status) {
    if (status === "Pago") return "#dbeafe";
    if (status === "Pendente") return "#fee2e2";
    if (status === "Reservado") return "#fef3c7";
    if (status === "Cancelado") return "#e5e7eb";
    return "#dcfce7";
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
      <h1 style={{ textAlign: "center", fontSize: "38px" }}>
        Arena do Manassés ⚽
      </h1>

      <p style={{ textAlign: "center", fontSize: "18px" }}>
        Agenda semanal, horários e faturamento automático
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "15px",
          marginTop: "30px",
        }}
      >
        <Card titulo="Faturamento" valor={`R$ ${resumo.faturamento}`} />
        <Card titulo="Pendente" valor={`R$ ${resumo.pendente}`} />
        <Card titulo="Jogos" valor={resumo.jogos} />
        <Card titulo="Pagos" valor={resumo.pagos} />
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
            gridTemplateColumns: "130px repeat(7, 220px)",
            gap: "10px",
            minWidth: "1700px",
          }}
        >
          <div style={cabecalho}>Horário</div>

          {dias.map((dia) => (
            <div key={dia} style={cabecalho}>
              {dia}
            </div>
          ))}

          {horarios.map((hora) => (
            <>
              <div key={hora} style={horarioStyle}>
                {hora}
              </div>

              {dias.map((dia) => {
                const item = agenda[dia][hora];

                return (
                  <div
                    key={`${dia}-${hora}`}
                    style={{
                      background: corStatus(item.status),
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                      padding: "10px",
                    }}
                  >
                    <input
                      placeholder="Dono/Time"
                      value={item.dono}
                      onChange={(e) =>
                        atualizar(dia, hora, "dono", e.target.value)
                      }
                      style={inputStyle}
                    />

                    <input
                      placeholder="Valor"
                      type="number"
                      value={item.valor}
                      onChange={(e) =>
                        atualizar(dia, hora, "valor", e.target.value)
                      }
                      style={inputStyle}
                    />

                    <select
                      value={item.status}
                      onChange={(e) =>
                        atualizar(dia, hora, "status", e.target.value)
                      }
                      style={inputStyle}
                    >
                      <option>Livre</option>
                      <option>Reservado</option>
                      <option>Pago</option>
                      <option>Pendente</option>
                      <option>Cancelado</option>
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
        background: "#1e293b",
        padding: "20px",
        borderRadius: "18px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#cbd5e1" }}>{titulo}</p>
      <h2 style={{ fontSize: "30px" }}>{valor}</h2>
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