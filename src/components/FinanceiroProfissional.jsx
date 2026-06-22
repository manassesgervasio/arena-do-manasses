import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { canManageFechamento } from "../utils/permissoes";
import { Button, Card, Input, LoadingState, Select, Textarea } from "./ui";

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

function obterPeriodoMes(mesAno) {
  const { ano, mes } = separarMesAno(mesAno);
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const fim = `${proximoAno}-${String(proximoMes).padStart(2, "0")}-01`;

  return { ano, mes, inicio, fim };
}

export default function FinanceiroProfissional({
  contextoArena,
  mesInicial = obterMesAtual(),
}) {
  const arenaAtualId = contextoArena?.arenaAtual?.id;
  const usuarioAtual = contextoArena?.usuarioAtual;
  const perfilAtual = contextoArena?.perfilAtual;
  const carregandoContexto = contextoArena?.carregandoContexto;
  const erroContexto = contextoArena?.erroContexto;
  const podeGerenciarFechamento = canManageFechamento(usuarioAtual, perfilAtual);
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
  const [reservasPagasPeriodo, setReservasPagasPeriodo] = useState(0);
  const [mensalistasPagosPeriodo, setMensalistasPagosPeriodo] =
    useState(0);
  const [resumoPeriodoCarregando, setResumoPeriodoCarregando] = useState(true);
  const [resumoPeriodoErro, setResumoPeriodoErro] = useState("");
  const [fechamentoMensal, setFechamentoMensal] = useState(null);
  const [fechamentoCarregando, setFechamentoCarregando] = useState(true);
  const [fechamentoSalvando, setFechamentoSalvando] = useState(false);
  const [fechamentoMensagem, setFechamentoMensagem] = useState("");
  const [fechamentoErro, setFechamentoErro] = useState("");
  const mesEstaFechado = Boolean(fechamentoMensal?.fechado);
  const mensagemMesFechado =
    "Este mês está fechado. Reabra o mês para alterar lançamentos.";

  async function carregarLancamentosManuais() {
    if (!arenaAtualId) {
      setLancamentosErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

    const { inicio, fim } = obterPeriodoMes(mesAno);

    setLancamentosCarregando(true);
    setLancamentosErro("");

    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select(
        "id,descricao,valor,tipo,categoria_id,forma_pagamento_id,data_lancamento,observacao,origem,referencia_id,created_at,updated_at"
      )
      .eq("origem", "manual")
      .eq("arena_id", arenaAtualId)
      .gte("data_lancamento", inicio)
      .lt("data_lancamento", fim)
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

    async function carregarLancamentosDoPeriodo() {
      if (carregandoContexto) return;

      if (!arenaAtualId) {
        setLancamentos([]);
        setLancamentosErro(erroContexto || "Nao foi possivel carregar o contexto da arena.");
        setLancamentosCarregando(false);
        return;
      }

      const { inicio, fim } = obterPeriodoMes(mesAno);

      setLancamentosCarregando(true);
      setLancamentosErro("");

      const { data, error } = await supabase
        .from("financeiro_lancamentos")
        .select(
          "id,descricao,valor,tipo,categoria_id,forma_pagamento_id,data_lancamento,observacao,origem,referencia_id,created_at,updated_at"
        )
        .eq("origem", "manual")
        .eq("arena_id", arenaAtualId)
        .gte("data_lancamento", inicio)
        .lt("data_lancamento", fim)
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

    carregarLancamentosDoPeriodo();

    return () => {
      ativo = false;
    };
  }, [arenaAtualId, carregandoContexto, erroContexto, mesAno]);

  useEffect(() => {
    let ativo = true;

    async function carregarResumoPeriodo() {
      if (carregandoContexto) return;

      if (!arenaAtualId) {
        setResumoPeriodoErro(erroContexto || "Nao foi possivel carregar o contexto da arena.");
        setReservasPagasPeriodo(0);
        setMensalistasPagosPeriodo(0);
        setResumoPeriodoCarregando(false);
        return;
      }

      const { inicio, fim } = obterPeriodoMes(mesAno);

      setResumoPeriodoCarregando(true);
      setResumoPeriodoErro("");

      const [
        { data: reservasData, error: reservasError },
        { data: mensalistasData, error: mensalistasError },
      ] = await Promise.all([
        supabase
          .from("reservas")
          .select("id,data,valor,status")
          .eq("status", "Pago")
          .eq("arena_id", arenaAtualId)
          .gte("data", inicio)
          .lt("data", fim),
        supabase
          .from("mensalista_pagamentos")
          .select("id,valor,situacao,data_pagamento")
          .eq("situacao", "Pago")
          .eq("arena_id", arenaAtualId)
          .gte("data_pagamento", inicio)
          .lt("data_pagamento", fim),
      ]);

      if (!ativo) return;

      if (reservasError || mensalistasError) {
        const erro = reservasError || mensalistasError;

        setResumoPeriodoErro(
          `Nao foi possivel carregar o resumo do periodo. ${erro.message}`
        );
        setReservasPagasPeriodo(0);
        setMensalistasPagosPeriodo(0);
        setResumoPeriodoCarregando(false);
        return;
      }

      setReservasPagasPeriodo(
        (reservasData || []).reduce(
          (total, reserva) => total + Number(reserva.valor || 0),
          0
        )
      );
      setMensalistasPagosPeriodo(
        (mensalistasData || []).reduce(
          (total, pagamento) => total + Number(pagamento.valor || 0),
          0
        )
      );
      setResumoPeriodoCarregando(false);
    }

    carregarResumoPeriodo();

    return () => {
      ativo = false;
    };
  }, [arenaAtualId, carregandoContexto, erroContexto, mesAno]);

  useEffect(() => {
    let ativo = true;

    async function carregarFechamentoMensal() {
      if (carregandoContexto) return;

      if (!arenaAtualId) {
        setFechamentoErro(erroContexto || "Nao foi possivel carregar o contexto da arena.");
        setFechamentoMensal(null);
        setFechamentoCarregando(false);
        return;
      }

      const { ano, mes } = separarMesAno(mesAno);

      setFechamentoCarregando(true);
      setFechamentoMensagem("");
      setFechamentoErro("");

      const { data, error } = await supabase
        .from("financeiro_fechamentos_mensais")
        .select(
          "id,ano,mes,total_reservas,total_mensalistas,total_entradas_manuais,total_despesas,saldo_liquido,fechado,fechado_em,observacao,created_at,updated_at"
        )
        .eq("arena_id", arenaAtualId)
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
  }, [arenaAtualId, carregandoContexto, erroContexto, mesAno]);

  const totais = useMemo(() => {
    const lancamentosDoMes = lancamentos.filter((lancamento) =>
      lancamento.data_lancamento >= obterPeriodoMes(mesAno).inicio &&
      lancamento.data_lancamento < obterPeriodoMes(mesAno).fim
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
        Number(reservasPagasPeriodo || 0) +
        Number(mensalistasPagosPeriodo || 0) +
        entradasManuais -
        despesas,
      lancamentosDoMes,
    };
  }, [lancamentos, mensalistasPagosPeriodo, mesAno, reservasPagasPeriodo]);

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

    if (!arenaAtualId) {
      setLancamentosErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

    if (mesEstaFechado) {
      setLancamentosErro(mensagemMesFechado);
      return;
    }

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
      arena_id: arenaAtualId,
      updated_at: new Date().toISOString(),
    };

    const { error } = lancamentoEditandoId
      ? await supabase
          .from("financeiro_lancamentos")
          .update(dadosLancamento)
          .eq("arena_id", arenaAtualId)
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
    if (!arenaAtualId) {
      setLancamentosErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

    if (mesEstaFechado) {
      setLancamentosErro(mensagemMesFechado);
      return;
    }

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
    if (!arenaAtualId) {
      setLancamentosErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

    if (mesEstaFechado) {
      setLancamentosErro(mensagemMesFechado);
      return;
    }

    const confirmar = confirm("Excluir este lancamento manual?");

    if (!confirmar) return;

    setLancamentosErro("");

    const { error } = await supabase
      .from("financeiro_lancamentos")
      .delete()
      .eq("arena_id", arenaAtualId)
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
    if (!podeGerenciarFechamento) {
      setFechamentoErro("Você não tem permissão para acessar esta área.");
      return;
    }

    if (!arenaAtualId) {
      setFechamentoErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

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
      .eq("arena_id", arenaAtualId)
      .eq("ano", ano)
      .eq("mes", mes)
      .maybeSingle();

    console.log("Fechamento encontrado:", fechamentoExistente);

    if (verificarError) {
      console.error("Erro ao verificar fechamento mensal:", verificarError);
      console.log("Erro no fechamento mensal:", verificarError);
      setFechamentoErro(
        `Não foi possível verificar o fechamento mensal: ${verificarError.message}`
      );
      setFechamentoSalvando(false);
      return;
    }

    if (fechamentoExistente?.fechado) {
      console.log("Fechamento mensal: registro ja esta fechado, sem insert/update.");
      setFechamentoMensal(fechamentoExistente);
      setFechamentoMensagem("Este mês já possui fechamento registrado.");
      setFechamentoSalvando(false);
      return;
    }

    const agora = new Date().toISOString();
    const observacaoAtual = fechamentoExistente?.observacao?.trim();
    const observacaoRefechamento = `Mes fechado novamente em ${formatarDataHora(agora)}`;
    const payload = {
      ano,
      mes,
      arena_id: arenaAtualId,
      total_reservas: Number(reservasPagasPeriodo || 0),
      total_mensalistas: Number(mensalistasPagosPeriodo || 0),
      total_entradas_manuais: totais.entradasManuais,
      total_despesas: totais.despesas,
      saldo_liquido: totais.saldoLiquido,
      fechado: true,
      fechado_em: agora,
      observacao: fechamentoExistente
        ? observacaoAtual
          ? `${observacaoAtual} | ${observacaoRefechamento}`
          : observacaoRefechamento
        : null,
      updated_at: agora,
    };

    console.log(
      fechamentoExistente
        ? "Fechamento mensal: vai fazer update."
        : "Fechamento mensal: vai fazer insert."
    );
    console.log("Payload do fechamento mensal:", payload);

    const resultado = fechamentoExistente
      ? await supabase
          .from("financeiro_fechamentos_mensais")
          .update(payload)
          .eq("arena_id", arenaAtualId)
          .eq("id", fechamentoExistente.id)
          .select()
          .single()
      : await supabase
          .from("financeiro_fechamentos_mensais")
          .insert(payload)
          .select()
          .single();

    const { data, error } = resultado;

    console.log("Retorno do fechamento mensal:", data);

    if (error) {
      console.error("Erro ao salvar fechamento mensal:", error);
      console.log("Erro no fechamento mensal:", error);
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

  async function reabrirMes() {
    if (!podeGerenciarFechamento) {
      setFechamentoErro("Você não tem permissão para acessar esta área.");
      return;
    }

    if (!arenaAtualId) {
      setFechamentoErro("Nao foi possivel carregar o contexto da arena.");
      return;
    }

    if (!fechamentoMensal?.id) return;

    const agora = new Date().toISOString();
    const reaberturaTexto = `Mês reaberto em ${formatarDataHora(agora)}`;
    const observacaoAtual = fechamentoMensal.observacao?.trim();
    const observacao = observacaoAtual
      ? `${observacaoAtual} | ${reaberturaTexto}`
      : reaberturaTexto;

    setFechamentoSalvando(true);
    setFechamentoMensagem("");
    setFechamentoErro("");

    const { data, error } = await supabase
      .from("financeiro_fechamentos_mensais")
      .update({
        fechado: false,
        observacao,
        updated_at: agora,
      })
      .eq("arena_id", arenaAtualId)
      .eq("id", fechamentoMensal.id)
      .select(
        "id,ano,mes,total_reservas,total_mensalistas,total_entradas_manuais,total_despesas,saldo_liquido,fechado,fechado_em,observacao,created_at,updated_at"
      )
      .single();

    if (error) {
      console.error("Erro ao reabrir mês:", error);
      setFechamentoErro(`Não foi possível reabrir o mês: ${error.message}`);
      setFechamentoSalvando(false);
      return;
    }

    setFechamentoMensal(data);
    setFechamentoMensagem("Mês reaberto com sucesso.");
    setLancamentosErro("");
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
          <Input
            type="month"
            value={mesAno}
            onChange={(event) => setMesAno(event.target.value)}
          />
        </label>
      </div>

      <div className="financeiro-profissional-summary">
        <ResumoCard titulo="Reservas pagas" valor={moeda(reservasPagasPeriodo)} />
        <ResumoCard titulo="Mensalistas pagos" valor={moeda(mensalistasPagosPeriodo)} />
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
        <Card
          as="form"
          className="financeiro-profissional-card"
          onSubmit={salvarLancamento}
        >
          <div className="financeiro-profissional-card-header">
            <h3>Lancamentos manuais</h3>
            {lancamentoEditandoId && (
              <Button type="button" onClick={limparFormulario}>
                Cancelar edicao
              </Button>
            )}
          </div>

          {mesEstaFechado && (
            <div className="financeiro-profissional-confirmation">
              {mensagemMesFechado}
            </div>
          )}

          <div className="financeiro-profissional-form">
            <label>
              <span>Descricao</span>
              <Input
                type="text"
                value={formulario.descricao}
                onChange={(event) => atualizarCampo("descricao", event.target.value)}
                placeholder="Ex: Compra de redes"
              />
            </label>

            <label>
              <span>Valor</span>
              <Input
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
              <Select
                value={formulario.tipo}
                onChange={(event) => atualizarCampo("tipo", event.target.value)}
              >
                <option value="entrada">Entrada</option>
                <option value="despesa">Despesa</option>
              </Select>
            </label>

            <label>
              <span>Categoria</span>
              <Select
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
              </Select>
            </label>

            <label>
              <span>Forma de pagamento</span>
              <Select
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
              </Select>
            </label>

            <label>
              <span>Data</span>
              <Input
                type="date"
                value={formulario.data}
                onChange={(event) => atualizarCampo("data", event.target.value)}
              />
            </label>

            <label className="financeiro-profissional-observacao">
              <span>Observacao</span>
              <Textarea
                value={formulario.observacao}
                onChange={(event) => atualizarCampo("observacao", event.target.value)}
                placeholder="Detalhes internos do lancamento"
              />
            </label>
          </div>

          {cadastrosCarregando && (
            <LoadingState className="financeiro-profissional-loading">
              Carregando categorias e formas de pagamento...
            </LoadingState>
          )}

          {cadastrosErro && (
            <div className="financeiro-profissional-error">{cadastrosErro}</div>
          )}

          {lancamentosErro && (
            <div className="financeiro-profissional-error">{lancamentosErro}</div>
          )}

          {resumoPeriodoCarregando && (
            <LoadingState className="financeiro-profissional-loading">
              Carregando resumo financeiro do periodo...
            </LoadingState>
          )}

          {resumoPeriodoErro && (
            <div className="financeiro-profissional-error">{resumoPeriodoErro}</div>
          )}

          <Button
            className="financeiro-profissional-primary"
            type="submit"
            disabled={salvandoLancamento || cadastrosCarregando || mesEstaFechado}
          >
            {salvandoLancamento
              ? "Salvando..."
              : lancamentoEditandoId
                ? "Salvar alteracoes"
                : "Adicionar lancamento"}
          </Button>
        </Card>

        <Card className="financeiro-profissional-card financeiro-profissional-close">
          <h3>Fechamento mensal</h3>
          <div className="financeiro-profissional-close-status">
            <span
              className={
                mesEstaFechado
                  ? "financeiro-profissional-status is-closed"
                  : "financeiro-profissional-status is-open"
              }
            >
              {fechamentoCarregando
                ? "Carregando"
                : mesEstaFechado
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
                Number(reservasPagasPeriodo || 0) +
                  Number(mensalistasPagosPeriodo || 0) +
                  totais.entradasManuais
              )}
            </p>
            <p>Despesas: {moeda(totais.despesas)}</p>
          </div>

          {podeGerenciarFechamento && (mesEstaFechado ? (
            <Button
              className="financeiro-profissional-secondary"
              type="button"
              onClick={reabrirMes}
              disabled={fechamentoCarregando || fechamentoSalvando}
            >
              {fechamentoSalvando ? "Reabrindo..." : "Reabrir mês"}
            </Button>
          ) : (
            <Button
              className="financeiro-profissional-primary"
              type="button"
              onClick={fecharMes}
              disabled={
                fechamentoCarregando || fechamentoSalvando || resumoPeriodoCarregando
              }
            >
              {fechamentoSalvando ? "Fechando..." : "Fechar mes"}
            </Button>
          ))}

          {mesEstaFechado && (
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
        </Card>
      </div>

      <Card className="financeiro-profissional-card">
        <div className="financeiro-profissional-card-header">
          <h3>Tabela de lancamentos</h3>
          <span>{totais.lancamentosDoMes.length} no mes</span>
        </div>

        {lancamentosCarregando && (
          <LoadingState className="financeiro-profissional-loading">
            Carregando lancamentos manuais...
          </LoadingState>
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
                        <Button
                          type="button"
                          disabled={mesEstaFechado}
                          onClick={() => editarLancamento(lancamento)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          className="financeiro-profissional-danger"
                          disabled={mesEstaFechado}
                          onClick={() => excluirLancamento(lancamento.id)}
                        >
                          Excluir
                        </Button>
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
      </Card>
    </section>
  );
}

function ResumoCard({ titulo, valor, tipo = "entrada" }) {
  return (
    <Card
      as="article"
      className={`financeiro-profissional-summary-card is-${tipo}`}
    >
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </Card>
  );
}
