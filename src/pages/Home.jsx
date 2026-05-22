import { useEffect, useState } from "react";
import AgendaGrid from "../components/AgendaGrid";
import AppHeader from "../components/AppHeader";
import ClientesSection from "../components/ClientesSection";
import MobileNavigation from "../components/MobileNavigation";
import ResumoCards from "../components/ResumoCards";
import WeekControls from "../components/WeekControls";

export default function Home({
  perfilLogado,
  permissoesLogado,
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
  const [activeMobileTab, setActiveMobileTab] = useState("agenda");
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia("(max-width: 640px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    function handleChange(event) {
      setIsMobile(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  function renderWeekControls() {
    return (
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
    );
  }

  function renderAgenda() {
    return (
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
        permissoesLogado={permissoesLogado}
      />
    );
  }

  function renderClientes() {
    return (
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
    );
  }

  function renderFinanceiro() {
    return (
      <section className="financeiro-mobile-section">
        <div className="financeiro-mobile-header">
          <h2>Financeiro</h2>
          <p>Resumo geral e mensal</p>
        </div>

        <ResumoCards resumo={resumo} moeda={moeda} />
      </section>
    );
  }

  function renderMobileContent() {
    if (activeMobileTab === "clientes") {
      return renderClientes();
    }

    if (activeMobileTab === "financeiro") {
      return renderFinanceiro();
    }

    return (
      <>
        {renderWeekControls()}
        {renderAgenda()}
      </>
    );
  }

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
      <AppHeader
        perfilLogado={perfilLogado}
        permissoesLogado={permissoesLogado}
      />
      {isMobile && (
        <MobileNavigation
          activeTab={activeMobileTab}
          onTabChange={setActiveMobileTab}
        />
      )}

      {isMobile ? (
        renderMobileContent()
      ) : (
        <>
          {renderWeekControls()}
          {renderFinanceiro()}
          {renderAgenda()}
          {renderClientes()}
        </>
      )}
</div>
</>
);
}
