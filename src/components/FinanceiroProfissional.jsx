import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const lancamentosIniciais = [
  {
    id: 1,
    data: "2026-05-03",
    descricao: "Venda de bebidas no torneio",
    tipo: "Entrada",
    categoria: "Bar",
    formaPagamento: "Pix",
    valor: 380,
    observacao: "Movimento do domingo",
  },
  {
    id: 2,
    data: "2026-05-08",
    descricao: "Manutencao da iluminacao",
    tipo: "Despesa",
    categoria: "Manutencao",
    formaPagamento: "Cartao",
    valor: 240,
    observacao: "Troca de refletores",
  },
  {
    id: 3,
    data: "2026-05-14",
    descricao: "Patrocinio local",
    tipo: "Entrada",
    categoria: "Patrocinio",
    formaPagamento: "Transferencia",
    valor: 600,
    observacao: "Apoio mensal",
  },
];

const formularioInicial = {
  descricao: "",
  valor: "",
  tipo: "Entrada",
  categoria: "",
  formaPagamento: "Pix",
  data: new Date().toISOString().split("T")[0],
  observacao: "",
};

function moeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function formatarData(dataTexto) {
  const [ano, mes, dia] = dataTexto.split("-");
  return `${dia}/${mes}/${ano}`;
}

function obterMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinanceiroProfissional({
  reservasPagas = 0,
  mensalistasPagos = 0,
  mesInicial = obterMesAtual(),
}) {
  const [mesAno, setMesAno] = useState(mesInicial);
  const [lancamentos, setLancamentos] = useState(lancamentosIniciais);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [categorias, setCategorias] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [cadastrosCarregando, setCadastrosCarregando] = useState(true);
  const [cadastrosErro, setCadastrosErro] = useState("");
  const [lancamentoEditandoId, setLancamentoEditandoId] = useState(null);
  const [mesFechado, setMesFechado] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarCadastrosFinanceiros() {
      setCadastrosCarregando(true);
      setCadastrosErro("");

      const [
        { data: categoriasData, error: categoriasError },
        { data: formasPagamentoData, error: formasPagamentoError },
      ] = await Promise.all([
        supabase
          .from("financeiro_categorias")
          .select("id,nome,tipo,ativo")
          .eq("ativo", true)
          .order("nome", { ascending: true }),
        supabase
          .from("financeiro_formas_pagamento")
          .select("id,nome,ativo")
          .eq("ativo", true)
          .order("nome", { ascending: true }),
      ]);

      if (!ativo) return;

      if (categoriasError || formasPagamentoError) {
        const erro = categoriasError || formasPagamentoError;

        setCadastrosErro(
          `Nao foi possivel carregar categorias e formas de pagamento. ${erro.message}`
        );
        setCategorias([]);
        setFormasPagamento([]);
        setCadastrosCarregando(false);
        return;
      }

      setCategorias(categoriasData || []);
      setFormasPagamento(formasPagamentoData || []);
      setCadastrosCarregando(false);
    }

    carregarCadastrosFinanceiros();

    return () => {
      ativo = false;
    };
  }, []);

  const totais = useMemo(() => {
    const lancamentosDoMes = lancamentos.filter((lancamento) =>
      lancamento.data.startsWith(mesAno)
    );

    const entradasManuais = lancamentosDoMes
      .filter((lancamento) => lancamento.tipo === "Entrada")
      .reduce((total, lancamento) => total + Number(lancamento.valor || 0), 0);

    const despesas = lancamentosDoMes
      .filter((lancamento) => lancamento.tipo === "Despesa")
      .reduce((total, lancamento) => total + Number(lancamento.valor || 0), 0);

    return {
      entradasManuais,
      despesas,
      saldoLiquido:
        Number(reservasPagas || 0) +
        Number(mensalistasPagos || 0) +
        entradasManuais -
        despesas,
      lancamentosDoMes,
    };
  }, [lancamentos, mensalistasPagos, mesAno, reservasPagas]);

  const categoriasDoTipo = useMemo(() => {
    const tipoAtual = formulario.tipo.toLowerCase();

    return categorias.filter((categoria) => categoria.tipo === tipoAtual);
  }, [categorias, formulario.tipo]);

  function atualizarCampo(campo, valor) {
    if (campo === "tipo") {
      const tipoSelecionado = valor.toLowerCase();
      const categoriaAtualValida = categorias.some(
        (categoria) =>
          categoria.tipo === tipoSelecionado && categoria.nome === formulario.categoria
      );

      setFormulario((anterior) => ({
        ...anterior,
        tipo: valor,
        categoria: categoriaAtualValida ? anterior.categoria : "",
      }));
      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setFormulario({
      ...formularioInicial,
      data: `${mesAno}-01`,
    });
    setLancamentoEditandoId(null);
  }

  function salvarLancamento(event) {
    event.preventDefault();

    const descricao = formulario.descricao.trim();
    const categoria = formulario.categoria.trim();
    const valor = Number(String(formulario.valor).replace(",", "."));

    if (!descricao || !categoria || !valor || valor <= 0) return;

    const proximoLancamento = {
      ...formulario,
      id: lancamentoEditandoId || Date.now(),
      descricao,
      categoria,
      valor,
    };

    setLancamentos((anteriores) => {
      if (!lancamentoEditandoId) {
        return [proximoLancamento, ...anteriores];
      }

      return anteriores.map((lancamento) =>
        lancamento.id === lancamentoEditandoId ? proximoLancamento : lancamento
      );
    });

    limparFormulario();
    setMesFechado(false);
  }

  function editarLancamento(lancamento) {
    setFormulario({
      descricao: lancamento.descricao,
      valor: String(lancamento.valor),
      tipo: lancamento.tipo,
      categoria: lancamento.categoria,
      formaPagamento: lancamento.formaPagamento,
      data: lancamento.data,
      observacao: lancamento.observacao,
    });
    setLancamentoEditandoId(lancamento.id);
    setMesFechado(false);
  }

  function excluirLancamento(id) {
    setLancamentos((anteriores) =>
      anteriores.filter((lancamento) => lancamento.id !== id)
    );
    setMesFechado(false);

    if (lancamentoEditandoId === id) {
      limparFormulario();
    }
  }

  return (
    <section className="financeiro-profissional">
      <div className="financeiro-profissional-header">
        <div>
          <h2>Financeiro Profissional</h2>
          <p>Controle financeiro da arena</p>
        </div>

        <label className="financeiro-profissional-filter">
          <span>Mes e ano</span>
          <input
            type="month"
            value={mesAno}
            onChange={(event) => {
              setMesAno(event.target.value);
              setMesFechado(false);
            }}
          />
        </label>
      </div>

      <div className="financeiro-profissional-summary">
        <ResumoCard titulo="Reservas pagas" valor={moeda(reservasPagas)} />
        <ResumoCard titulo="Mensalistas pagos" valor={moeda(mensalistasPagos)} />
        <ResumoCard
          titulo="Entradas manuais"
          valor={moeda(totais.entradasManuais)}
        />
        <ResumoCard titulo="Despesas" valor={moeda(totais.despesas)} tipo="saida" />
        <ResumoCard
          titulo="Saldo liquido"
          valor={moeda(totais.saldoLiquido)}
          tipo={totais.saldoLiquido >= 0 ? "saldo" : "saida"}
        />
      </div>

      <div className="financeiro-profissional-layout">
        <form className="financeiro-profissional-card" onSubmit={salvarLancamento}>
          <div className="financeiro-profissional-card-header">
            <h3>Lancamentos manuais</h3>
            {lancamentoEditandoId && (
              <button type="button" onClick={limparFormulario}>
                Cancelar edicao
              </button>
            )}
          </div>

          <div className="financeiro-profissional-form">
            <label>
              <span>Descricao</span>
              <input
                type="text"
                value={formulario.descricao}
                onChange={(event) => atualizarCampo("descricao", event.target.value)}
                placeholder="Ex: Compra de redes"
              />
            </label>

            <label>
              <span>Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formulario.valor}
                onChange={(event) => atualizarCampo("valor", event.target.value)}
                placeholder="0,00"
              />
            </label>

            <label>
              <span>Tipo</span>
              <select
                value={formulario.tipo}
                onChange={(event) => atualizarCampo("tipo", event.target.value)}
              >
                <option>Entrada</option>
                <option>Despesa</option>
              </select>
            </label>

            <label>
              <span>Categoria</span>
              <select
                value={formulario.categoria}
                onChange={(event) => atualizarCampo("categoria", event.target.value)}
                disabled={cadastrosCarregando || Boolean(cadastrosErro)}
              >
                <option value="">Selecione</option>
                {categoriasDoTipo.map((categoria) => (
                  <option key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Forma de pagamento</span>
              <select
                value={formulario.formaPagamento}
                onChange={(event) =>
                  atualizarCampo("formaPagamento", event.target.value)
                }
                disabled={cadastrosCarregando || Boolean(cadastrosErro)}
              >
                {formasPagamento.map((formaPagamento) => (
                  <option key={formaPagamento.id} value={formaPagamento.nome}>
                    {formaPagamento.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Data</span>
              <input
                type="date"
                value={formulario.data}
                onChange={(event) => atualizarCampo("data", event.target.value)}
              />
            </label>

            <label className="financeiro-profissional-observacao">
              <span>Observacao</span>
              <textarea
                value={formulario.observacao}
                onChange={(event) => atualizarCampo("observacao", event.target.value)}
                placeholder="Detalhes internos do lancamento"
              />
            </label>
          </div>

          {cadastrosCarregando && (
            <div className="financeiro-profissional-loading">
              Carregando categorias e formas de pagamento...
            </div>
          )}

          {cadastrosErro && (
            <div className="financeiro-profissional-error">{cadastrosErro}</div>
          )}

          <button className="financeiro-profissional-primary" type="submit">
            {lancamentoEditandoId ? "Salvar alteracoes" : "Adicionar lancamento"}
          </button>
        </form>

        <div className="financeiro-profissional-card financeiro-profissional-close">
          <h3>Fechamento mensal</h3>
          <div className="financeiro-profissional-close-summary">
            <span>Resumo do mes</span>
            <strong>{moeda(totais.saldoLiquido)}</strong>
            <p>
              Entradas totais:{" "}
              {moeda(
                Number(reservasPagas || 0) +
                  Number(mensalistasPagos || 0) +
                  totais.entradasManuais
              )}
            </p>
            <p>Despesas: {moeda(totais.despesas)}</p>
          </div>

          <button
            className="financeiro-profissional-primary"
            type="button"
            onClick={() => setMesFechado(true)}
          >
            Fechar mes
          </button>

          {mesFechado && (
            <div className="financeiro-profissional-confirmation">
              Fechamento confirmado visualmente. Nenhum dado foi gravado no banco.
            </div>
          )}
        </div>
      </div>

      <div className="financeiro-profissional-card">
        <div className="financeiro-profissional-card-header">
          <h3>Tabela de lancamentos</h3>
          <span>{totais.lancamentosDoMes.length} no mes</span>
        </div>

        <div className="financeiro-profissional-table-wrap">
          <table className="financeiro-profissional-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descricao</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Forma de pagamento</th>
                <th>Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {totais.lancamentosDoMes.map((lancamento) => (
                <tr key={lancamento.id}>
                  <td>{formatarData(lancamento.data)}</td>
                  <td>
                    <strong>{lancamento.descricao}</strong>
                    {lancamento.observacao && <small>{lancamento.observacao}</small>}
                  </td>
                  <td>
                    <span
                      className={`financeiro-profissional-badge financeiro-profissional-badge-${lancamento.tipo.toLowerCase()}`}
                    >
                      {lancamento.tipo}
                    </span>
                  </td>
                  <td>{lancamento.categoria}</td>
                  <td>{lancamento.formaPagamento}</td>
                  <td
                    className={
                      lancamento.tipo === "Despesa"
                        ? "financeiro-profissional-value-out"
                        : "financeiro-profissional-value-in"
                    }
                  >
                    {moeda(lancamento.valor)}
                  </td>
                  <td>
                    <div className="financeiro-profissional-actions">
                      <button type="button" onClick={() => editarLancamento(lancamento)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="financeiro-profissional-danger"
                        onClick={() => excluirLancamento(lancamento.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {totais.lancamentosDoMes.length === 0 && (
                <tr>
                  <td colSpan="7" className="financeiro-profissional-empty">
                    Nenhum lancamento mockado para este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ResumoCard({ titulo, valor, tipo = "entrada" }) {
  return (
    <article className={`financeiro-profissional-summary-card is-${tipo}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </article>
  );
}
