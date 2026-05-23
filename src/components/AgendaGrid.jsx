import { useState } from "react";
import DiaCabecalho from "./DiaCabecalho";
import HorarioCard from "./HorarioCard";

export default function AgendaGrid({
  dias,
  horarios,
  diasSemana,
  tipoLista,
  statusLista,
  horariosMensalistas = {},
  formatarData,
  formatarDataBR,
  moeda,
  pegarReserva,
  atualizarReserva,
  reservarHorario,
  alugarMensalistaComoAvulso,
  limparReserva,
  permissoesLogado,
}) {
  const [diaMobileIndex, setDiaMobileIndex] = useState(0);
  const diaMobile = dias[diaMobileIndex] || dias[0];

  function calcularResumoDia(data) {
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

    return {
      textoData,
      totalDia,
      jogosDia,
    };
  }

  function renderDiaCabecalho(data) {
    const { textoData, totalDia, jogosDia } = calcularResumoDia(data);

    return (
      <DiaCabecalho
        key={textoData}
        diaSemana={diasSemana[data.getDay()]}
        dataFormatada={formatarDataBR(textoData)}
        totalDia={totalDia}
        jogosDia={jogosDia}
        moeda={moeda}
      />
    );
  }

  function renderHorarioCard(data, hora) {
    const dataTexto = formatarData(data);
    const item = pegarReserva(dataTexto, hora);
    const temReservaReal =
      item.status !== "Livre" ||
      (item.tipo && item.tipo !== "Avulso") ||
      Boolean(item.cliente?.trim()) ||
      Boolean(item.telefone?.trim()) ||
      Number(item.valor || 0) > 0;
    const mensalistaContratado = temReservaReal
      ? null
      : horariosMensalistas[`${data.getDay()}_${hora}`] || null;

    return (
      <HorarioCard
        key={`${dataTexto}-${hora}`}
        item={item}
        hora={hora}
        mensalistaContratado={mensalistaContratado}
        tipoLista={tipoLista}
        statusLista={statusLista}
        onClienteChange={(e) =>
          atualizarReserva(
            dataTexto,
            hora,
            "cliente",
            e.target.value
          )
        }
        onTelefoneChange={(e) =>
          atualizarReserva(
            dataTexto,
            hora,
            "telefone",
            e.target.value
          )
        }
        onValorChange={(e) =>
          atualizarReserva(
            dataTexto,
            hora,
            "valor",
            e.target.value
          )
        }
        onTipoChange={(e) =>
          atualizarReserva(
            dataTexto,
            hora,
            "tipo",
            e.target.value
          )
        }
        onStatusChange={(e) =>
          atualizarReserva(
            dataTexto,
            hora,
            "status",
            e.target.value
          )
        }
        onReservar={() => reservarHorario(dataTexto, hora)}
        onAlugarComoAvulso={(dadosReserva) =>
          alugarMensalistaComoAvulso(dataTexto, hora, dadosReserva)
        }
        onLimpar={() => {
  if (item.status === "Pago") {
    if (!permissoesLogado?.podeLimparPago) {
      alert("Seu perfil não permite limpar horários pagos. Peça ajuda a um administrador.");
      return;
    }

    const senha = prompt("Digite a senha de administrador para limpar horário pago:");

    if (senha !== "1234") {
      alert("Senha incorreta.");
      return;
    }
  }

  const confirmar = confirm(
    "Tem certeza que deseja limpar esta reserva?");

  if (confirmar) {
    limparReserva(dataTexto, hora);
  }
}}
      />
    );
  }

  return (
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
        className="agenda-desktop"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
          gap: "10px",
          minWidth: "100%",
        }}
      >
        {dias.map((data) => renderDiaCabecalho(data))}

        {horarios.map((hora) => (
<div key={hora} style={{ display: "contents" }}>
  
  {dias.map((data) => renderHorarioCard(data, hora))}
        </div>
))}
      </div>

      <div className="agenda-mobile">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(42px, 1fr))",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          {dias.map((data, index) => {
            const textoData = formatarData(data);

            return (
              <button
                key={textoData}
                type="button"
                onClick={() => setDiaMobileIndex(index)}
                style={{
                  minHeight: "44px",
                  border:
                    index === diaMobileIndex
                      ? "2px solid #22c55e"
                      : "1px solid #cbd5e1",
                  borderRadius: "10px",
                  background: index === diaMobileIndex ? "#dcfce7" : "white",
                  color: "#0f172a",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <div>{diasSemana[data.getDay()]}</div>
                <div style={{ fontSize: "11px" }}>
                  {textoData.split("-")[2]}
                </div>
              </button>
            );
          })}
        </div>

        {diaMobile && (
          <>
            {renderDiaCabecalho(diaMobile)}

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {horarios.map((hora) => renderHorarioCard(diaMobile, hora))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
