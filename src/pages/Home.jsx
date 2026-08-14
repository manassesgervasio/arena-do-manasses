import { useEffect, useState } from "react";
import AgendaGrid from "../components/AgendaGrid";
import AppHeader from "../components/AppHeader";
import ConfiguracoesArena from "../components/ConfiguracoesArena";
import FinanceiroCentral from "../components/FinanceiroCentral";
import MobileNavigation from "../components/MobileNavigation";
import PainelCentralSaaS from "../components/PainelCentralSaaS";
import PrimeirosPassos from "../components/PrimeirosPassos";
import UsuariosArena from "../components/UsuariosArena";
import WeekControls from "../components/WeekControls";
import ArenaCam from "./ArenaCam";
import { navigationItems } from "../navigation";
import {
  canAccessClientes,
  canAccessConfiguracoesArena,
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
  onboardingRefreshKey,
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
  pathname = "/",
  onNavigate,
}) {
  const [activeMobileTab, setActiveMobileTab] = useState(() =>
    obterTabPorPathname(pathname)
  );
  const [mostrarPainelSaaS, setMostrarPainelSaaS] = useState(false);
  const [mostrarUsuariosArena, setMostrarUsuariosArena] = useState(false);
  const [mostrarConfiguracoesArena, setMostrarConfiguracoesArena] =
    useState(false);
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
    configuracoes: canAccessConfiguracoesArena(usuarioAtual, perfilAtual),
  };
  const mobileNavigationItems = navigationItems.filter((item) => {
    if (item.id === "financeiro") {
      return (
        permissoesArena.financeiro ||
        permissoesArena.mensalistas ||
        permissoesArena.clientes
      );
    }
    return true;
  });
  const menuExtraItems = [
    !modoPublico && permissoesArena.painelSaaS
      ? {
          id: "painel-saas",
          label: "Painel SaaS",
          onClick: () => {
            setMostrarUsuariosArena(false);
            setMostrarConfiguracoesArena(false);
            setMostrarPainelSaaS(true);
          },
        }
      : null,
    !modoPublico && permissoesArena.configuracoes
      ? {
          id: "configuracoes-arena",
          label: "Configurações da Arena",
          onClick: () => {
            setMostrarPainelSaaS(false);
            setMostrarUsuariosArena(false);
            setMostrarConfiguracoesArena(true);
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
    setActiveMobileTab(obterTabPorPathname(pathname));
  }, [pathname]);

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

    if (!permissoesArena.configuracoes) {
      setMostrarConfiguracoesArena(false);
    }
  }, [
    activeMobileTab,
    mobileNavigationItems,
    permissoesArena.financeiro,
    permissoesArena.painelSaaS,
    permissoesArena.usuarios,
    permissoesArena.configuracoes,
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

  function renderFinanceiro() {
    if (
      !permissoesArena.financeiro &&
      !permissoesArena.mensalistas &&
      !permissoesArena.clientes
    ) {
      return <AccessDenied />;
    }

    return (
      <FinanceiroCentral
        contextoArena={contextoArena}
        mesFiltro={mesFiltro}
        abaInicial={obterAbaFinanceiroPorPathname(pathname)}
        permissoesArena={permissoesArena}
        resumo={resumo}
        pendenciasPagamento={pendenciasPagamento}
        moeda={moeda}
        clientes={clientes}
        clientesFiltrados={clientesFiltrados}
        buscaCliente={buscaCliente}
        filtroCliente={filtroCliente}
        clienteSelecionado={clienteSelecionado}
        formatarDataBR={formatarDataBR}
        onBuscaClienteChange={(e) => setBuscaCliente(e.target.value)}
        onFiltroClienteChange={(e) => setFiltroCliente(e.target.value)}
        onClienteSelect={(cliente) => setClienteSelecionado(cliente)}
        onClienteModalClose={() => setClienteSelecionado(null)}
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

    if (mostrarConfiguracoesArena) {
      if (!permissoesArena.configuracoes) return <AccessDenied />;

      return (
        <ConfiguracoesArena
          contextoArena={contextoArena}
          onVoltar={() => setMostrarConfiguracoesArena(false)}
          onGerenciarUsuarios={() => {
            setMostrarPainelSaaS(false);
            setMostrarConfiguracoesArena(false);
            setMostrarUsuariosArena(true);
          }}
        />
      );
    }

    if (activeMobileTab === "financeiro") {
      return renderFinanceiro();
    }

    if (activeMobileTab === "arenacam") {
      return <ArenaCam contextoArena={contextoArena} />;
    }

    return (
      <>
        <PrimeirosPassos
          contextoArena={contextoArena}
          refreshKey={onboardingRefreshKey}
        />
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

    if (mostrarConfiguracoesArena) {
      return permissoesArena.configuracoes ? (
        <ConfiguracoesArena
          contextoArena={contextoArena}
          onVoltar={() => setMostrarConfiguracoesArena(false)}
          onGerenciarUsuarios={() => {
            setMostrarPainelSaaS(false);
            setMostrarConfiguracoesArena(false);
            setMostrarUsuariosArena(true);
          }}
        />
      ) : (
        <AccessDenied />
      );
    }

    if (activeMobileTab === "financeiro") return renderFinanceiro();
    if (activeMobileTab === "arenacam") {
      return <ArenaCam contextoArena={contextoArena} />;
    }

    return (
      <>
        <PrimeirosPassos
          contextoArena={contextoArena}
          refreshKey={onboardingRefreshKey}
        />
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
          setMostrarConfiguracoesArena(false);
          setMostrarPainelSaaS(true);
        }}
        onAbrirConfiguracoesArena={() => {
          if (!permissoesArena.configuracoes) return;

          setMostrarPainelSaaS(false);
          setMostrarUsuariosArena(false);
          setMostrarConfiguracoesArena(true);
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
          setMostrarConfiguracoesArena(false);
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
          setMostrarConfiguracoesArena(false);
          setActiveMobileTab(tab);
          const item = navigationItems.find((navItem) => navItem.id === tab);
          onNavigate?.(item?.path || "/agenda");
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

function obterTabPorPathname(pathname) {
  const rotaFinanceiroAntiga = obterAbaFinanceiroPorPathname(pathname);

  if (rotaFinanceiroAntiga) return "financeiro";

  const item = navigationItems.find((navItem) => navItem.path === pathname);

  return item?.id || "agenda";
}

function obterAbaFinanceiroPorPathname(pathname) {
  const caminho = String(pathname || "");

  if (caminho === "/clientes") return "clientes";
  if (caminho === "/mensalistas") return "mensalistas";
  if (caminho === "/financeiro-profissional") return "visao-geral";
  if (caminho === "/financeiro") return "visao-geral";
  if (caminho === "/financeiro/receitas") return "receitas";
  if (caminho === "/financeiro/despesas") return "despesas";
  if (caminho === "/financeiro/mensalistas") return "mensalistas";
  if (caminho === "/financeiro/clientes") return "clientes";
  if (caminho === "/financeiro/lancamentos") return "lancamentos";

  return "";
}
