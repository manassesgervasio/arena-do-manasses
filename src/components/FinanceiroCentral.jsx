import { useEffect, useMemo, useState } from "react";
import ClientesSection from "./ClientesSection";
import FinanceiroProfissional from "./FinanceiroProfissional";
import MensalistasSection from "./MensalistasSection";

const abasBase = [
  { id: "visao-geral", label: "Visão geral", requires: "financeiro" },
  { id: "lancamentos", label: "Lançamentos", requires: "financeiro" },
  { id: "mensalistas", label: "Mensalistas", requires: "mensalistas" },
  { id: "clientes", label: "Clientes", requires: "clientes" },
];

export default function FinanceiroCentral({
  contextoArena,
  mesFiltro,
  abaInicial = "visao-geral",
  permissoesArena,
  resumo,
  pendenciasPagamento = [],
  moeda,
  clientes,
  clientesFiltrados,
  buscaCliente,
  filtroCliente,
  clienteSelecionado,
  formatarDataBR,
  onBuscaClienteChange,
  onFiltroClienteChange,
  onClienteSelect,
  onClienteModalClose,
  onMensalistasChange,
}) {
  const abasDisponiveis = useMemo(
    () =>
      abasBase.filter((aba) => {
        if (aba.requires === "financeiro") return permissoesArena.financeiro;
        if (aba.requires === "mensalistas") return permissoesArena.mensalistas;
        if (aba.requires === "clientes") return permissoesArena.clientes;
        return false;
      }),
    [permissoesArena]
  );
  const [abaAtiva, setAbaAtiva] = useState(
    obterAbaDisponivel(abaInicial, abasDisponiveis)
  );

  useEffect(() => {
    setAbaAtiva(obterAbaDisponivel(abaInicial, abasDisponiveis));
  }, [abaInicial, abasDisponiveis]);

  if (abasDisponiveis.length === 0) {
    return <section className="access-denied">Você não tem permissão para acessar esta área.</section>;
  }

  function renderConteudo() {
    if (abaAtiva === "mensalistas") {
      return (
        <MensalistasSection
          moeda={moeda}
          contextoArena={contextoArena}
          onMensalistasChange={onMensalistasChange}
        />
      );
    }

    if (abaAtiva === "clientes") {
      return (
        <ClientesSection
          clientes={clientes}
          clientesFiltrados={clientesFiltrados}
          buscaCliente={buscaCliente}
          filtroCliente={filtroCliente}
          moeda={moeda}
          formatarDataBR={formatarDataBR}
          clienteSelecionado={clienteSelecionado}
          onBuscaClienteChange={onBuscaClienteChange}
          onFiltroClienteChange={onFiltroClienteChange}
          onClienteSelect={onClienteSelect}
          onClienteModalClose={onClienteModalClose}
        />
      );
    }

    return (
      <FinanceiroProfissional
        contextoArena={contextoArena}
        mesInicial={mesFiltro}
        modo={abaAtiva}
        resumo={resumo}
        pendenciasPagamento={pendenciasPagamento}
        onIrParaAba={setAbaAtiva}
      />
    );
  }

  return (
    <section className="financeiro-central">
      <nav className="financeiro-central-tabs" aria-label="Áreas do financeiro">
        {abasDisponiveis.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={abaAtiva === aba.id ? "is-active" : ""}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      <div className="financeiro-central-content">{renderConteudo()}</div>
    </section>
  );
}

function obterAbaDisponivel(abaInicial, abasDisponiveis) {
  const encontrada = abasDisponiveis.find((aba) => aba.id === abaInicial);

  return encontrada?.id || abasDisponiveis[0]?.id || "visao-geral";
}
