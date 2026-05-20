import DiaCabecalho from "./DiaCabecalho";
import HorarioCard from "./HorarioCard";

export default function AgendaGrid({
  dias,
  horarios,
  diasSemana,
  tipoLista,
  statusLista,
  formatarData,
  formatarDataBR,
  moeda,
  pegarReserva,
  atualizarReserva,
  reservarHorario,
  limparReserva,
}) {
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
            <DiaCabecalho
              key={textoData}
              diaSemana={diasSemana[data.getDay()]}
              dataFormatada={formatarDataBR(textoData)}
              totalDia={totalDia}
              jogosDia={jogosDia}
              moeda={moeda}
            />
          );
        })}

        {horarios.map((hora) => (
<div key={hora} style={{ display: "contents" }}>
  
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
                <HorarioCard
                  key={`${dataTexto}-${hora}`}
                  item={item}
                  hora={hora}
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
                  onLimpar={() => {
  if (item.status === "Pago") {
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
                          })}
        </div>
))}
      </div>
    </div>
  );
}
