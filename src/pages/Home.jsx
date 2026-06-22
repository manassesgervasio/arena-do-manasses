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
  onEntrar,
  modoPublico = false,
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
  solicitarReservaPublica,
  limparReserva,
  notificacoesPendentes,
  pendenciasPagamento,
  onConfirmarNotificacao,
  onRecusarNotificacao,
  onMarcarPagamentoPago,
  onIrParaReserva,
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
  const [mostrarApenasOcupados, setMostrarApenasOcupados] = useState(false);
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
  const menuExtraItems = [
    !modoPublico && permissoesArena.painelSaaS
      ? {
          id: "painel-saas",
          label: "Painel SaaS",
          onClick: () => {
            setMostrarUsuariosArena(false);
            setMostrarPainelSaaS(true);
          },
        }
      : null,
    !modoPublico && permissoesArena.usuarios
      ? {
          id: "usuarios",
          label: "Usuários",
          onClick: () => {
            setMostrarPainelSaaS(false);
            setMostrarUsuariosArena(true);
          },
        }
      : null,
    modoPublico
      ? {
          id: "entrar",
          label: "Entrar",
          onClick: onEntrar,
        }
      : {
          id: "sair",
          label: "Sair",
          onClick: onSair,
        },
  ].filter(Boolean);

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
        mesFiltro={mesFiltro}
        onMesFiltroChange={(e) => setMesFiltro(e.target.value)}
        mostrarApenasOcupados={mostrarApenasOcupados}
        onMostrarApenasOcupadosChange={setMostrarApenasOcupados}
      />
    );
  }

  function mudarSemanaAgenda(direcao) {
    const primeiraDataVisivel = new Date(dataBase);

    primeiraDataVisivel.setDate(primeiraDataVisivel.getDate() + direcao * 7);
    setMesFiltro(formatarMesFiltro(primeiraDataVisivel));
    mudarSemana(direcao);
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
        solicitarReservaPublica={solicitarReservaPublica}
        limparReserva={limparReserva}
        mostrarApenasOcupados={mostrarApenasOcupados}
        modoPublico={modoPublico}
        arenaNome={contextoArena?.arenaAtual?.nome || "ArenaBase"}
        onSemanaAnterior={() => mudarSemanaAgenda(-1)}
        onSemanaProxima={() => mudarSemanaAgenda(1)}
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

  function renderDesktopContent() {
    if (mostrarPainelSaaS) {
      return permissoesArena.painelSaaS ? (
        <PainelCentralSaaS
          contextoArena={contextoArena}
          onVoltar={() => setMostrarPainelSaaS(false)}
        />
      ) : (
        <AccessDenied />
      );
    }

    if (mostrarUsuariosArena) {
      return permissoesArena.usuarios ? (
        <UsuariosArena
          contextoArena={contextoArena}
          onVoltar={() => setMostrarUsuariosArena(false)}
        />
      ) : (
        <AccessDenied />
      );
    }

    if (activeMobileTab === "clientes") return renderClientes();
    if (activeMobileTab === "financeiro") return renderFinanceiro();
    if (activeMobileTab === "financeiro-profissional") {
      return renderFinanceiroProfissional();
    }
    if (activeMobileTab === "mensalistas") return renderMensalistas();

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
        onEntrar={onEntrar}
        modoPublico={modoPublico}
        notificacoesPendentes={notificacoesPendentes}
        pendenciasPagamento={pendenciasPagamento}
        onConfirmarNotificacao={onConfirmarNotificacao}
        onRecusarNotificacao={onRecusarNotificacao}
        onMarcarPagamentoPago={onMarcarPagamentoPago}
        onIrParaReserva={(reserva) => {
          setMostrarPainelSaaS(false);
          setMostrarUsuariosArena(false);
          setMostrarFinanceiroProfissional(false);
          setActiveMobileTab("agenda");
          onIrParaReserva?.(reserva);
        }}
        formatarDataBR={formatarDataBR}
        moeda={moeda}
      />
      <MobileNavigation
        activeTab={activeMobileTab}
        items={mobileNavigationItems}
        extraItems={menuExtraItems}
        arenaNome={!modoPublico ? contextoArena?.arenaAtual?.nome : ""}
        onTabChange={(tab) => {
          setMostrarPainelSaaS(false);
          setMostrarUsuariosArena(false);
          setActiveMobileTab(tab);
        }}
      />

      {isMobile ? (
        renderMobileContent()
      ) : (
        renderDesktopContent()
      )}
</div>
</>
);
}

function formatarMesFiltro(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

function AccessDenied() {
  return (
    <section className="access-denied">
      Você não tem permissão para acessar esta área.
    </section>
  );
}
