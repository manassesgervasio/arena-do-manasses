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
  solicitarReservaPublica,
  limparReserva,
  podeLimparHorarioPago,
  mostrarApenasOcupados,
  modoPublico,
  arenaNome,
  onSemanaAnterior,
  onSemanaProxima,
}) {
  const [diaMobileIndex, setDiaMobileIndex] = useState(() =>
    obterIndiceDoDiaAtual(dias)
  );
  const [horarioAbertoPorDia, setHorarioAbertoPorDia] = useState({});
  const diaSelecionado = dias[diaMobileIndex] || dias[0];
  const diaMobile = diaSelecionado;
  const podeVoltarSemana = !modoPublico || dataEhFutura(dias[0]);

  function alternarHorarioAberto(dataTexto, hora) {
    setHorarioAbertoPorDia((anterior) => ({
      ...anterior,
      [dataTexto]: anterior[dataTexto] === hora ? "" : hora,
    }));
  }

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
        ocultarResumo={modoPublico}
      />
    );
  }

  function renderHorarioCard(data, hora) {
    const dataTexto = formatarData(data);
    const item = pegarReserva(dataTexto, hora);
    const dataPassadaPublica = modoPublico && dataEhPassada(data);
    const temReservaReal =
      item.status !== "Livre" ||
      (item.tipo && item.tipo !== "Avulso") ||
      Boolean(item.cliente?.trim()) ||
      Boolean(item.telefone?.trim()) ||
      Number(item.valor || 0) > 0;
    const mensalistaContratado = temReservaReal
      ? null
      : horariosMensalistas[`${data.getDay()}_${hora}`] || null;
    const horarioOcupado = temReservaReal || Boolean(mensalistaContratado);

    if (mostrarApenasOcupados && !horarioOcupado) return null;

    return (
      <HorarioCard
        key={`${dataTexto}-${hora}`}
        item={item}
        hora={hora}
        mensalistaContratado={mensalistaContratado}
        tipoLista={tipoLista}
        statusLista={statusLista}
        expandido={horarioAbertoPorDia[dataTexto] === hora}
        compactoLivre={!horarioOcupado}
        modoPublico={modoPublico}
        arenaNome={arenaNome}
        dataTexto={dataTexto}
        dataFormatada={formatarDataBR(dataTexto)}
        reservaIndisponivel={dataPassadaPublica}
        onToggleExpandido={() => alternarHorarioAberto(dataTexto, hora)}
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
        onSolicitarReservaPublica={(dadosCliente) =>
          solicitarReservaPublica(dataTexto, hora, dadosCliente)
        }
        onAlugarComoAvulso={(dadosReserva) =>
          alugarMensalistaComoAvulso(dataTexto, hora, dadosReserva)
        }
        onLimpar={async () => {
  if (item.status === "Pago") {
    if (!podeLimparHorarioPago) {
      alert("Seu perfil não permite limpar horários pagos. Peça ajuda a um administrador.");
      return;
    }
  }

  const confirmar = confirm(
    "Deseja limpar esta reserva?");

  if (confirmar) {
    await limparReserva(dataTexto, hora);
  }
}}
      />
    );
  }

  function renderSeletorDiaDesktop() {
    return (
      <div className="agenda-desktop-day-nav">
        <button
          className="agenda-week-arrow"
          type="button"
          onClick={podeVoltarSemana ? onSemanaAnterior : undefined}
          disabled={!podeVoltarSemana}
          aria-label="Semana anterior"
        >
          {"‹"}
        </button>

        <div className="agenda-desktop-day-selector">
          {dias.map((data, index) => {
            const textoData = formatarData(data);
            const dataCurta = formatarDataBR(textoData)
              .split("/")
              .slice(0, 2)
              .join("/");
            const dataPassadaPublica = modoPublico && dataEhPassada(data);

            return (
              <button
                className={`agenda-desktop-day-button${
                  index === diaMobileIndex ? " is-selected" : ""
                }${dataPassadaPublica ? " is-disabled" : ""}`}
                key={textoData}
                type="button"
                onClick={() => {
                  if (dataPassadaPublica) return;

                  setDiaMobileIndex(index);
                }}
                disabled={dataPassadaPublica}
              >
                <span>{diasSemana[data.getDay()]}</span>
                <strong>{dataCurta}</strong>
              </button>
            );
          })}
        </div>

        <button
          className="agenda-week-arrow"
          type="button"
          onClick={onSemanaProxima}
          aria-label="Próxima semana"
        >
          {"›"}
        </button>
      </div>
    );
  }

  return (
    <div className="agenda-shell">
      <div className="agenda-desktop agenda-desktop-dia">
        {renderSeletorDiaDesktop()}

        {diaSelecionado && (
          <>
            {renderDiaCabecalho(diaSelecionado)}

            <div className="agenda-desktop-horarios">
              {horarios.map((hora) => renderHorarioCard(diaSelecionado, hora))}
            </div>
          </>
        )}
      </div>

      <div className="agenda-mobile">
        <div className="agenda-mobile-week-nav">
          <button
            className="agenda-week-arrow"
            type="button"
            onClick={podeVoltarSemana ? onSemanaAnterior : undefined}
            disabled={!podeVoltarSemana}
            aria-label="Semana anterior"
          >
            {"‹"}
          </button>

          <div className="agenda-mobile-day-selector">
            {dias.map((data, index) => {
              const textoData = formatarData(data);
              const dataPassadaPublica = modoPublico && dataEhPassada(data);

              return (
                <button
                  className={`agenda-mobile-day-button${
                    index === diaMobileIndex ? " is-selected" : ""
                  }${dataPassadaPublica ? " is-disabled" : ""}`}
                  key={textoData}
                  type="button"
                  onClick={() => {
                    if (dataPassadaPublica) return;

                    setDiaMobileIndex(index);
                  }}
                  disabled={dataPassadaPublica}
                >
                  <div>{diasSemana[data.getDay()]}</div>
                  <div className="agenda-mobile-day-number">
                    {textoData.split("-")[2]}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            className="agenda-week-arrow"
            type="button"
            onClick={onSemanaProxima}
            aria-label="Próxima semana"
          >
            {"›"}
          </button>
        </div>

        {diaMobile && (
          <>
            {renderDiaCabecalho(diaMobile)}

            <div className="agenda-mobile-horarios">
              {horarios.map((hora) => renderHorarioCard(diaMobile, hora))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function obterIndiceDoDiaAtual(dias) {
  const hoje = new Date();
  const hojeTexto = formatarDataLocal(hoje);
  const indiceHoje = dias.findIndex(
    (data) => formatarDataLocal(data) === hojeTexto
  );

  return indiceHoje >= 0 ? indiceHoje : 0;
}

function dataEhPassada(data) {
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  const dataComparada = new Date(data);

  dataComparada.setHours(0, 0, 0, 0);

  return dataComparada < hoje;
}

function dataEhFutura(data) {
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  const dataComparada = new Date(data);

  dataComparada.setHours(0, 0, 0, 0);

  return dataComparada > hoje;
}

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}
