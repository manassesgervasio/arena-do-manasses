import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const formularioInicial = {
  descricao: "",
  valor: "",
  tipo: "entrada",
  categoriaId: "",
  formaPagamentoId: "",
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

function formatarDataHora(dataTexto) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dataTexto));
}

function obterMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function separarMesAno(mesAno) {
  const [ano, mes] = mesAno.split("-").map(Number);

  return { ano, mes };
}

export default function FinanceiroProfissional({
  reservasPagas = 0,
  mensalistasPagos = 0,
  mesInicial = obterMesAtual(),
}) {
  const [mesAno, setMesAno] = useState(mesInicial);
  const [lancamentos, setLancamentos] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [categorias, setCategorias] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [cadastrosCarregando, setCadastrosCarregando] = useState(true);
  const [cadastrosErro, setCadastrosErro] = useState("");
  const [lancamentosCarregando, setLancamentosCarregando] = useState(true);
  const [lancamentosErro, setLancamentosErro] = useState("");
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);
  const [lancamentoEditandoId, setLancamentoEditandoId] = useState(null);
  const [fechamentoMensal, setFechamentoMensal] = useState(null);
  const [fechamentoCarregando, setFechamentoCarregando] = useState(true);
  const [fechamentoSalvando, setFechamentoSalvando] = useState(false);
  const [fechamentoMensagem, setFechamentoMensagem] = useState("");
  const [fechamentoErro, setFechamentoErro] = useState("");

  async function carregarLancamentosManuais() {
    setLancamentosCarregando(true);
    setLancamentosErro("");

    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select(
        "id,descricao,valor,tipo,categoria_id,forma_pagamento_id,data_lancamento,observacao,origem,referencia_id,created_at,updated_at"
      )
      .eq("origem", "manual")
      .order("data_lancamento", { ascending: false });

    if (error) {
      setLancamentosErro(
        `Nao foi possivel carregar os lancamentos manuais. ${error.message}`
      );
      setLancamentos([]);
      setLancamentosCarregando(false);
      return;
    }

    setLancamentos(data || []);
    setLancamentosCarregando(false);
  }

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

  useEffect(() => {
    let ativo = true;

    async function carregarComControle() {
      setLancamentosCarregando(true);
      setLancamentosErro("");

      const { data, error } = await supabase
        .from("financeiro_lancamentos")
        .select(
          "id,descricao,valor,tipo,categoria_id,forma_pagamento_id,data_lancamento,observacao,origem,referencia_id,created_at,updated_at"
        )
        .eq("origem", "manual")
        .order("data_lancamento", { ascending: false });

      if (!ativo) return;

      if (error) {
        setLancamentosErro(
          `Nao foi possivel carregar os lancamentos manuais. ${error.message}`
        );
        setLancamentos([]);
        setLancamentosCarregando(false);
        return;
      }

      setLancamentos(data || []);
      setLancamentosCarregando(false);
    }

    carregarComControle();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarFechamentoMensal() {
      const { ano, mes } = separarMesAno(mesAno);

      setFechamentoCarregando(true);
      setFechamentoMensagem("");
      setFechamentoErro("");

      const { data, error } = await supabase
        .from("financeiro_fechamentos_mensais")
        .select(
          "id,ano,mes,total_reservas,total_mensalistas,total_entradas_manuais,total_despesas,saldo_liquido,fechado,fechado_em,observacao,created_at,updated_at"
        )
        .eq("ano", ano)
        .eq("mes", mes)
        .maybeSingle();

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar fechamento mensal:", error);
        setFechamentoErro(
          `Nao foi possivel carregar o fechamento mensal. ${error.message}`
        );
        setFechamentoMensal(null);
        setFechamentoCarregando(false);
        return;
      }

      setFechamentoMensal(data || null);
      setFechamentoCarregando(false);
    }

    carregarFechamentoMensal();

    return () => {
      ativo = false;
    };
  }, [mesAno]);

  const totais = useMemo(() => {
    const lancamentosDoMes = lancamentos.filter((lancamento) =>
      lancamento.data_lancamento.startsWith(mesAno)
    );

    const entradasManuais = lancamentosDoMes
      .filter((lancamento) => lancamento.tipo === "entrada")
      .reduce((total, lancamento) => total + Number(lancamento.valor || 0), 0);

    const despesas = lancamentosDoMes
      .filter((lancamento) => lancamento.tipo === "despesa")
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
    return categorias.filter((categoria) => categoria.tipo === formulario.tipo);
  }, [categorias, formulario.tipo]);

  const categoriasPorId = useMemo(() => {
    return categorias.reduce((mapa, categoria) => {
      mapa[categoria.id] = categoria;
      return mapa;
    }, {});
  }, [categorias]);

  const formasPagamentoPorId = useMemo(() => {
    return formasPagamento.reduce((mapa, formaPagamento) => {
      mapa[formaPagamento.id] = formaPagamento;
      return mapa;
    }, {});
  }, [formasPagamento]);

  function atualizarCampo(campo, valor) {
    if (campo === "tipo") {
      const categoriaAtualValida = categorias.some(
        (categoria) =>
          categoria.tipo === valor && categoria.id === formulario.categoriaId
      );

      setFormulario((anterior) => ({
        ...anterior,
        tipo: valor,
        categoriaId: categoriaAtualValida ? anterior.categoriaId : "",
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

  async function salvarLancamento(event) {
    event.preventDefault();

    const descricao = formulario.descricao.trim();
    const valor = Number(String(formulario.valor).replace(",", "."));

    if (
      !descricao ||
      !valor ||
      valor <= 0 ||
      !formulario.tipo ||
      !formulario.categoriaId ||
      !formulario.formaPagamentoId ||
      !formulario.data
    ) {
      setLancamentosErro("Preencha descricao, valor, tipo, categoria, forma de pagamento e data.");
      return;
    }

    setSalvandoLancamento(true);
    setLancamentosErro("");

    const dadosLancamento = {
      descricao,
      valor,
      tipo: formulario.tipo,
      categoria_id: formulario.categoriaId,
      forma_pagamento_id: formulario.formaPagamentoId,
      data_lancamento: formulario.data,
      observacao: formulario.observacao.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = lancamentoEditandoId
      ? await supabase
          .from("financeiro_lancamentos")
          .update(dadosLancamento)
          .eq("id", lancamentoEditandoId)
          .eq("origem", "manual")
      : await supabase.from("financeiro_lancamentos").insert({
          ...dadosLancamento,
          origem: "manual",
          referencia_id: null,
        });

    if (error) {
      setLancamentosErro(
        `Nao foi possivel salvar o lancamento manual. ${error.message}`
      );
      setSalvandoLancamento(false);
      return;
    }

    limparFormulario();
    await carregarLancamentosManuais();
    setSalvandoLancamento(false);
  }

  function editarLancamento(lancamento) {
    setFormulario({
      descricao: lancamento.descricao,
      valor: String(lancamento.valor),
      tipo: lancamento.tipo,
      categoriaId: lancamento.categoria_id || "",
      formaPagamentoId: lancamento.forma_pagamento_id || "",
      data: lancamento.data_lancamento,
      observacao: lancamento.observacao || "",
    });
    setLancamentoEditandoId(lancamento.id);
  }

  async function excluirLancamento(id) {
    const confirmar = confirm("Excluir este lancamento manual?");

    if (!confirmar) return;

    setLancamentosErro("");

    const { error } = await supabase
      .from("financeiro_lancamentos")
      .delete()
      .eq("id", id)
      .eq("origem", "manual");

    if (error) {
      setLancamentosErro(
        `Nao foi possivel excluir o lancamento manual. ${error.message}`
      );
      return;
    }

    if (lancamentoEditandoId === id) limparFormulario();

    await carregarLancamentosManuais();
  }

  async function fecharMes() {
    const confirmar = confirm(
      "Tem certeza que deseja fechar este mês? O fechamento salvará o resumo financeiro atual deste período, mas não bloqueará o uso do sistema nesta versão."
    );

    if (!confirmar) return;

    const { ano, mes } = separarMesAno(mesAno);

    setFechamentoSalvando(true);
    setFechamentoMensagem("");
    setFechamentoErro("");

    const { data: fechamentoExistente, error: verificarError } = await supabase
      .from("financeiro_fechamentos_mensais")
      .select("*")
      .eq("ano", ano)
      .eq("mes", mes)
      .maybeSingle();

    if (verificarError) {
      console.error("Erro ao verificar fechamento mensal:", verificarError);
      setFechamentoErro(
        `Não foi possível verificar o fechamento mensal: ${verificarError.message}`
      );
      setFechamentoSalvando(false);
      return;
    }

    if (fechamentoExistente) {
      setFechamentoMensal(fechamentoExistente);
      setFechamentoMensagem("Este mês já possui fechamento registrado.");
      setFechamentoSalvando(false);
      return;
    }

    const agora = new Date().toISOString();
    const payload = {
      ano,
      mes,
      total_reservas: Number(reservasPagas || 0),
      total_mensalistas: Number(mensalistasPagos || 0),
      total_entradas_manuais: totais.entradasManuais,
      total_despesas: totais.despesas,
      saldo_liquido: totais.saldoLiquido,
      fechado: true,
      fechado_em: agora,
      observacao: null,
      updated_at: agora,
    };

    const { data, error } = await supabase
      .from("financeiro_fechamentos_mensais")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar fechamento mensal:", error);
      setFechamentoErro(
        `Não foi possível salvar o fechamento mensal: ${error.message}`
      );
      setFechamentoSalvando(false);
      return;
    }

    setFechamentoMensal(data);
    setFechamentoMensagem("Fechamento mensal salvo com sucesso.");
    setFechamentoSalvando(false);
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
            onChange={(event) => setMesAno(event.target.value)}
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
                <option value="entrada">Entrada</option>
                <option value="despesa">Despesa</option>
              </select>
            </label>

            <label>
              <span>Categoria</span>
              <select
                value={formulario.categoriaId}
                onChange={(event) => atualizarCampo("categoriaId", event.target.value)}
                disabled={cadastrosCarregando || Boolean(cadastrosErro)}
              >
                <option value="">Selecione</option>
                {categoriasDoTipo.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Forma de pagamento</span>
              <select
                value={formulario.formaPagamentoId}
                onChange={(event) =>
                  atualizarCampo("formaPagamentoId", event.target.value)
                }
                disabled={cadastrosCarregando || Boolean(cadastrosErro)}
              >
                <option value="">Selecione</option>
                {formasPagamento.map((formaPagamento) => (
                  <option key={formaPagamento.id} value={formaPagamento.id}>
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

          {lancamentosErro && (
            <div className="financeiro-profissional-error">{lancamentosErro}</div>
          )}

          <button
            className="financeiro-profissional-primary"
            type="submit"
            disabled={salvandoLancamento || cadastrosCarregando}
          >
            {salvandoLancamento
              ? "Salvando..."
              : lancamentoEditandoId
                ? "Salvar alteracoes"
                : "Adicionar lancamento"}
          </button>
        </form>

        <div className="financeiro-profissional-card financeiro-profissional-close">
          <h3>Fechamento mensal</h3>
          <div className="financeiro-profissional-close-status">
            <span
              className={
                fechamentoMensal?.fechado
                  ? "financeiro-profissional-status is-closed"
                  : "financeiro-profissional-status is-open"
              }
            >
              {fechamentoCarregando
                ? "Carregando"
                : fechamentoMensal?.fechado
                  ? "Fechado"
                  : "Aberto"}
            </span>

            {fechamentoMensal?.fechado_em && (
              <p>Fechado em {formatarDataHora(fechamentoMensal.fechado_em)}</p>
            )}
          </div>

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
            onClick={fecharMes}
            disabled={fechamentoCarregando || fechamentoSalvando}
          >
            {fechamentoSalvando ? "Fechando..." : "Fechar mes"}
          </button>

          {fechamentoMensal?.fechado && (
            <div className="financeiro-profissional-confirmation">
              Este mês possui fechamento registrado.
            </div>
          )}

          {fechamentoMensagem && (
            <div className="financeiro-profissional-confirmation">
              {fechamentoMensagem}
            </div>
          )}

          {fechamentoErro && (
            <div className="financeiro-profissional-error">{fechamentoErro}</div>
          )}
        </div>
      </div>

      <div className="financeiro-profissional-card">
        <div className="financeiro-profissional-card-header">
          <h3>Tabela de lancamentos</h3>
          <span>{totais.lancamentosDoMes.length} no mes</span>
        </div>

        {lancamentosCarregando && (
          <div className="financeiro-profissional-loading">
            Carregando lancamentos manuais...
          </div>
        )}

        {lancamentosErro && (
          <div className="financeiro-profissional-error">{lancamentosErro}</div>
        )}

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
              {!lancamentosCarregando &&
                totais.lancamentosDoMes.map((lancamento) => (
                  <tr key={lancamento.id}>
                    <td>{formatarData(lancamento.data_lancamento)}</td>
                    <td>
                      <strong>{lancamento.descricao}</strong>
                      {lancamento.observacao && <small>{lancamento.observacao}</small>}
                    </td>
                    <td>
                      <span
                        className={`financeiro-profissional-badge financeiro-profissional-badge-${lancamento.tipo}`}
                      >
                        {lancamento.tipo === "entrada" ? "Entrada" : "Despesa"}
                      </span>
                    </td>
                    <td>
                      {categoriasPorId[lancamento.categoria_id]?.nome ||
                        "Categoria nao encontrada"}
                    </td>
                    <td>
                      {formasPagamentoPorId[lancamento.forma_pagamento_id]?.nome ||
                        "Forma nao encontrada"}
                    </td>
                    <td
                      className={
                        lancamento.tipo === "despesa"
                          ? "financeiro-profissional-value-out"
                          : "financeiro-profissional-value-in"
                      }
                    >
                      {moeda(lancamento.valor)}
                    </td>
                    <td>
                      <div className="financeiro-profissional-actions">
                        <button
                          type="button"
                          onClick={() => editarLancamento(lancamento)}
                        >
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

              {!lancamentosCarregando && totais.lancamentosDoMes.length === 0 && (
                <tr>
                  <td colSpan="7" className="financeiro-profissional-empty">
                    Nenhum lancamento manual para este mes.
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
