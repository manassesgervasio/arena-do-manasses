import { useEffect, useState } from "react";
import AgendaGrid from "../components/AgendaGrid";
import AppHeader from "../components/AppHeader";
import ClientesSection from "../components/ClientesSection";
import FinanceiroProfissional from "../components/FinanceiroProfissional";
import MensalistasSection from "../components/MensalistasSection";
import MobileNavigation from "../components/MobileNavigation";
import PainelCentralSaaS from "../components/PainelCentralSaaS";
import ResumoCards from "../components/ResumoCards";
import UsuariosArena from "../components/UsuariosArena";
import WeekControls from "../components/WeekControls";
import { navigationItems } from "../navigation";
import {
  canAccessClientes,
  canAccessFinanceiro,
  canAccessMensalistas,
  canAccessPainelSaaS,
  canAccessUsuariosArena,
  canLimparHorarioPago,
} from "../utils/permissoes";

export default function Home({
  perfilLogado,
  permissoesLogado,
  contextoArena,
  onSair,
  dataBase,
  mesFiltro,
  dias,
  horarios,
  diasSemana,
  tipoLista,
  statusLista,
  horariosMensalistas,
  onMensalistasChange,
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
  alugarMensalistaComoAvulso,
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
  const [mostrarFinanceiroProfissional, setMostrarFinanceiroProfissional] =
    useState(false);
  const [mostrarPainelSaaS, setMostrarPainelSaaS] = useState(false);
  const [mostrarUsuariosArena, setMostrarUsuariosArena] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia("(max-width: 640px)").matches
  );
  const usuarioAtual = contextoArena?.usuarioAtual;
  const perfilAtual = contextoArena?.perfilAtual;
  const permissoesArena = {
    clientes: canAccessClientes(usuarioAtual, perfilAtual),
    financeiro: canAccessFinanceiro(usuarioAtual, perfilAtual),
    mensalistas: canAccessMensalistas(usuarioAtual, perfilAtual),
    painelSaaS: canAccessPainelSaaS(usuarioAtual),
    usuarios: canAccessUsuariosArena(usuarioAtual, perfilAtual),
  };
  const mobileNavigationItems = navigationItems.filter((item) => {
    if (item.id === "clientes") return permissoesArena.clientes;
    if (item.id === "financeiro" || item.id === "financeiro-profissional") {
      return permissoesArena.financeiro;
    }
    if (item.id === "mensalistas") return permissoesArena.mensalistas;
    return true;
  });

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

  useEffect(() => {
    if (!mobileNavigationItems.some((item) => item.id === activeMobileTab)) {
      setActiveMobileTab("agenda");
    }

    if (!permissoesArena.financeiro) {
      setMostrarFinanceiroProfissional(false);
    }

    if (!permissoesArena.painelSaaS) {
      setMostrarPainelSaaS(false);
    }

    if (!permissoesArena.usuarios) {
      setMostrarUsuariosArena(false);
    }
  }, [
    activeMobileTab,
    mobileNavigationItems,
    permissoesArena.financeiro,
    permissoesArena.painelSaaS,
    permissoesArena.usuarios,
  ]);

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
        horariosMensalistas={horariosMensalistas}
        formatarData={formatarData}
        formatarDataBR={formatarDataBR}
        moeda={moeda}
        pegarReserva={pegarReserva}
        atualizarReserva={atualizarReserva}
        reservarHorario={reservarHorario}
        alugarMensalistaComoAvulso={alugarMensalistaComoAvulso}
        limparReserva={limparReserva}
        podeLimparHorarioPago={canLimparHorarioPago(
          usuarioAtual,
          perfilAtual,
          permissoesLogado
        )}
      />
    );
  }

  function renderClientes() {
    if (!permissoesArena.clientes) return <AccessDenied />;

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
    if (!permissoesArena.financeiro) return <AccessDenied />;

    return (
      <section className="financeiro-mobile-section">
        <div className="financeiro-mobile-header">
          <h2>Financeiro</h2>
          <p>Resumo geral e mensal</p>
        </div>

        <ResumoCards resumo={resumo} moeda={moeda} />

        {!isMobile && (
          <div className="financeiro-profissional-access">
            <button
              type="button"
              onClick={() =>
                setMostrarFinanceiroProfissional((mostrar) => !mostrar)
              }
            >
              {mostrarFinanceiroProfissional
                ? "Ocultar Financeiro Profissional"
                : "Abrir Financeiro Profissional"}
            </button>
          </div>
        )}
      </section>
    );
  }

  function renderFinanceiroProfissional() {
    if (!permissoesArena.financeiro) return <AccessDenied />;

    return (
      <FinanceiroProfissional
        contextoArena={contextoArena}
        mesInicial={mesFiltro}
      />
    );
  }

  function renderMensalistas() {
    if (!permissoesArena.mensalistas) return <AccessDenied />;

    return (
      <MensalistasSection
        moeda={moeda}
        perfilLogado={perfilLogado}
        contextoArena={contextoArena}
        onMensalistasChange={onMensalistasChange}
      />
    );
  }

  function renderMobileContent() {
    if (mostrarPainelSaaS) {
      if (!permissoesArena.painelSaaS) return <AccessDenied />;

      return (
        <PainelCentralSaaS
          contextoArena={contextoArena}
          onVoltar={() => setMostrarPainelSaaS(false)}
        />
      );
    }

    if (mostrarUsuariosArena) {
      if (!permissoesArena.usuarios) return <AccessDenied />;

      return (
        <UsuariosArena
          contextoArena={contextoArena}
          onVoltar={() => setMostrarUsuariosArena(false)}
        />
      );
    }

    if (activeMobileTab === "clientes") {
      return renderClientes();
    }

    if (activeMobileTab === "financeiro") {
      return renderFinanceiro();
    }

    if (activeMobileTab === "financeiro-profissional") {
      return renderFinanceiroProfissional();
    }

    if (activeMobileTab === "mensalistas") {
      return renderMensalistas();
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
        contextoArena={contextoArena}
        onAbrirPainelSaaS={() => {
          if (!permissoesArena.painelSaaS) return;

          setMostrarUsuariosArena(false);
          setMostrarPainelSaaS(true);
        }}
        onAbrirUsuariosArena={() => {
          if (!permissoesArena.usuarios) return;

          setMostrarPainelSaaS(false);
          setMostrarUsuariosArena(true);
        }}
        onSair={onSair}
      />
      {isMobile && (
        <MobileNavigation
          activeTab={activeMobileTab}
          items={mobileNavigationItems}
          onTabChange={(tab) => {
            setMostrarPainelSaaS(false);
            setMostrarUsuariosArena(false);
            setActiveMobileTab(tab);
          }}
        />
      )}

      {isMobile ? (
        renderMobileContent()
      ) : mostrarPainelSaaS ? (
        permissoesArena.painelSaaS ? (
        <PainelCentralSaaS
          contextoArena={contextoArena}
          onVoltar={() => setMostrarPainelSaaS(false)}
        />
        ) : (
          <AccessDenied />
        )
      ) : mostrarUsuariosArena ? (
        permissoesArena.usuarios ? (
        <UsuariosArena
          contextoArena={contextoArena}
          onVoltar={() => setMostrarUsuariosArena(false)}
        />
        ) : (
          <AccessDenied />
        )
      ) : (
        <>
          {renderWeekControls()}
          {permissoesArena.financeiro && renderFinanceiro()}
          {permissoesArena.financeiro &&
            mostrarFinanceiroProfissional &&
            renderFinanceiroProfissional()}
          {renderAgenda()}
          {permissoesArena.mensalistas && renderMensalistas()}
          {permissoesArena.clientes && renderClientes()}
        </>
      )}
</div>
</>
);
}

function AccessDenied() {
  return (
    <section className="access-denied">
      Você não tem permissão para acessar esta área.
    </section>
  );
}
