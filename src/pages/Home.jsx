import AgendaGrid from "../components/AgendaGrid";
import AppHeader from "../components/AppHeader";
import ClientesSection from "../components/ClientesSection";
import ResumoCards from "../components/ResumoCards";
import WeekControls from "../components/WeekControls";

export default function Home({
  dataBase,
  mesFiltro,
  dias,
  horarios,
  diasSemana,
  tipoLista,
  statusLista,
  resumo,
  clientes,
  clientesFiltrados,
  buscaCliente,
  filtroCliente,
  clienteSelecionado,
  formatarData,
  formatarDataBR,
  moeda,
  pegarReserva,
  atualizarReserva,
  reservarHorario,
  limparReserva,
  mudarSemana,
  alterarData,
  copiarFixosProximaSemana,
  setMesFiltro,
  setBuscaCliente,
  setFiltroCliente,
  setClienteSelecionado,
}) {
  return (
  <>
    <div
      className="home-page"
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
          alterarData(e.target.value)
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
