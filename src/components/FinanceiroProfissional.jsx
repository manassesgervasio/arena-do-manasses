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

function formatarMesAnoLabel(mesAno) {
  const { ano, mes } = separarMesAno(mesAno);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, 1));
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

function obterPeriodoAno(mesAno) {
  const { ano } = separarMesAno(mesAno);

  return {
    ano,
    inicio: `${ano}-01-01`,
    fim: `${ano + 1}-01-01`,
  };
}

function adicionarMeses(mesAno, deslocamento) {
  const { ano, mes } = separarMesAno(mesAno);
  const data = new Date(ano, mes - 1 + deslocamento, 1);

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function obterMesesEvolucao(mesAno, quantidade = 6) {
  return Array.from({ length: quantidade }, (_, indice) =>
    adicionarMeses(mesAno, indice - quantidade + 1)
  );
}

function formatarMesCurto(mesAno) {
  const { ano, mes } = separarMesAno(mesAno);
  const mesLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  })
    .format(new Date(ano, mes - 1, 1))
    .replace(".", "");

  return `${mesLabel}/${String(ano).slice(-2)}`;
}

function obterChaveMes(dataTexto) {
  return String(dataTexto || "").slice(0, 7);
}

function criarSerieEvolucaoZerada(meses) {
  return meses.map((mesAno) => ({
    mesAno,
    label: formatarMesCurto(mesAno),
    entradas: 0,
    saidas: 0,
    saldo: 0,
  }));
}

function criarSerieEvolucao({ meses, reservas, mensalistas, lancamentos }) {
  const porMes = criarSerieEvolucaoZerada(meses).reduce((mapa, item) => {
    mapa[item.mesAno] = item;
    return mapa;
  }, {});

  reservas.forEach((reserva) => {
    const item = porMes[obterChaveMes(reserva.data)];
    if (!item) return;

    item.entradas += Number(reserva.valor || 0);
  });

  mensalistas.forEach((pagamento) => {
    const item = porMes[obterChaveMes(pagamento.data_pagamento)];
    if (!item) return;

    item.entradas += Number(pagamento.valor || 0);
  });

  lancamentos.forEach((lancamento) => {
    const item = porMes[obterChaveMes(lancamento.data_lancamento)];
    if (!item) return;

    if (lancamento.tipo === "despesa") {
      item.saidas += Number(lancamento.valor || 0);
      return;
    }

    if (lancamento.tipo === "entrada") {
      item.entradas += Number(lancamento.valor || 0);
    }
  });

  return meses.map((mesAno) => {
    const item = porMes[mesAno];

    return {
      ...item,
      saldo: item.entradas - item.saidas,
    };
  });
}

export default function FinanceiroProfissional({
  contextoArena,
  mesInicial = obterMesAtual(),
  modo = "visao-geral",
  resumo,
  pendenciasPagamento = [],
  onIrParaAba,
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
  const [faturamentoAno, setFaturamentoAno] = useState(0);
  const [resumoPeriodoCarregando, setResumoPeriodoCarregando] = useState(true);
  const [resumoPeriodoErro, setResumoPeriodoErro] = useState("");
  const [evolucaoMensal, setEvolucaoMensal] = useState([]);
  const [evolucaoCarregando, setEvolucaoCarregando] = useState(true);
  const [evolucaoErro, setEvolucaoErro] = useState("");
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
      setLancamentosErro("Não foi possível carregar o contexto da arena.");
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
        `Não foi possível carregar os lançamentos manuais. ${error.message}`
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
          `Não foi possível carregar categorias e formas de pagamento. ${erro.message}`
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
        setLancamentosErro(erroContexto || "Não foi possível carregar o contexto da arena.");
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
          `Não foi possível carregar os lançamentos manuais. ${error.message}`
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
        setResumoPeriodoErro(erroContexto || "Não foi possível carregar o contexto da arena.");
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
          `Não foi possível carregar o resumo do período. ${erro.message}`
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

    async function carregarFaturamentoAno() {
      if (carregandoContexto) return;

      if (!arenaAtualId) {
        setFaturamentoAno(0);
        return;
      }

      const { inicio, fim } = obterPeriodoAno(mesAno);

      const [
        { data: reservasData, error: reservasError },
        { data: mensalistasData, error: mensalistasError },
        { data: lancamentosData, error: lancamentosError },
      ] = await Promise.all([
        supabase
          .from("reservas")
          .select("id,valor,status,data")
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
        supabase
          .from("financeiro_lancamentos")
          .select("id,valor,tipo,data_lancamento,origem")
          .eq("tipo", "entrada")
          .eq("origem", "manual")
          .eq("arena_id", arenaAtualId)
          .gte("data_lancamento", inicio)
          .lt("data_lancamento", fim),
      ]);

      if (!ativo) return;

      if (reservasError || mensalistasError || lancamentosError) {
        const erro = reservasError || mensalistasError || lancamentosError;

        console.error("Erro ao carregar faturamento anual:", erro);
        setFaturamentoAno(0);
        return;
      }

      const totalReservas = (reservasData || []).reduce(
        (total, reserva) => total + Number(reserva.valor || 0),
        0
      );
      const totalMensalistas = (mensalistasData || []).reduce(
        (total, pagamento) => total + Number(pagamento.valor || 0),
        0
      );
      const totalEntradasManuais = (lancamentosData || []).reduce(
        (total, lancamento) => total + Number(lancamento.valor || 0),
        0
      );

      setFaturamentoAno(totalReservas + totalMensalistas + totalEntradasManuais);
    }

    carregarFaturamentoAno();

    return () => {
      ativo = false;
    };
  }, [arenaAtualId, carregandoContexto, mesAno]);

  useEffect(() => {
    let ativo = true;

    async function carregarFechamentoMensal() {
      if (carregandoContexto) return;

      if (!arenaAtualId) {
        setFechamentoErro(erroContexto || "Não foi possível carregar o contexto da arena.");
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
          `Não foi possível carregar o fechamento mensal. ${error.message}`
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

  useEffect(() => {
    let ativo = true;

    async function carregarEvolucaoMensal() {
      if (carregandoContexto) return;

      const meses = obterMesesEvolucao(mesAno);

      if (!arenaAtualId) {
        setEvolucaoMensal(criarSerieEvolucaoZerada(meses));
        setEvolucaoErro(erroContexto || "Não foi possível carregar o contexto da arena.");
        setEvolucaoCarregando(false);
        return;
      }

      const inicio = obterPeriodoMes(meses[0]).inicio;
      const fim = obterPeriodoMes(adicionarMeses(mesAno, 1)).inicio;

      setEvolucaoCarregando(true);
      setEvolucaoErro("");

      const [
        { data: reservasData, error: reservasError },
        { data: mensalistasData, error: mensalistasError },
        { data: lancamentosData, error: lancamentosError },
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
        supabase
          .from("financeiro_lancamentos")
          .select("id,valor,tipo,data_lancamento,origem")
          .eq("origem", "manual")
          .eq("arena_id", arenaAtualId)
          .gte("data_lancamento", inicio)
          .lt("data_lancamento", fim),
      ]);

      if (!ativo) return;

      if (reservasError || mensalistasError || lancamentosError) {
        const erro = reservasError || mensalistasError || lancamentosError;

        setEvolucaoMensal(criarSerieEvolucaoZerada(meses));
        setEvolucaoErro(
          `Não foi possível carregar a evolução financeira. ${erro.message}`
        );
        setEvolucaoCarregando(false);
        return;
      }

      setEvolucaoMensal(
        criarSerieEvolucao({
          meses,
          reservas: reservasData || [],
          mensalistas: mensalistasData || [],
          lancamentos: lancamentosData || [],
        })
      );
      setEvolucaoCarregando(false);
    }

    carregarEvolucaoMensal();

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
      setLancamentosErro("Não foi possível carregar o contexto da arena.");
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
      setLancamentosErro("Preencha descrição, valor, tipo, categoria, forma de pagamento e data.");
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
        `Não foi possível salvar o lançamento manual. ${error.message}`
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
      setLancamentosErro("Não foi possível carregar o contexto da arena.");
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
      setLancamentosErro("Não foi possível carregar o contexto da arena.");
      return;
    }

    if (mesEstaFechado) {
      setLancamentosErro(mensagemMesFechado);
      return;
    }

    const confirmar = confirm("Excluir este lançamento manual?");

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
        `Não foi possível excluir o lançamento manual. ${error.message}`
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
      setFechamentoErro("Não foi possível carregar o contexto da arena.");
      return;
    }

    const confirmar = confirm(
      "Deseja fechar este mês? O fechamento salvará o resumo financeiro atual do período."
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
      setFechamentoMensagem("Este m\u00eas j\u00e1 possui fechamento registrado.");
      setFechamentoSalvando(false);
      return;
    }

    const agora = new Date().toISOString();
    const observacaoAtual = fechamentoExistente?.observacao?.trim();
    const observacaoRefechamento = `Mês fechado novamente em ${formatarDataHora(agora)}`;
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
      setFechamentoErro("Não foi possível carregar o contexto da arena.");
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

  const cardsResumo = [
    {
      titulo: "Reservas pagas",
      valor: moeda(reservasPagasPeriodo),
      tipo: "reservas",
      icone: "calendar",
    },
    {
      titulo: "Mensalistas pagos",
      valor: moeda(mensalistasPagosPeriodo),
      tipo: "mensalistas",
      icone: "users",
    },
    {
      titulo: "Entradas manuais",
      valor: moeda(totais.entradasManuais),
      tipo: "entradas",
      icone: "plus",
    },
    {
      titulo: "Despesas",
      valor: moeda(totais.despesas),
      tipo: "despesas",
      icone: "minus",
    },
  ];
  const mesAnoLabel = formatarMesAnoLabel(mesAno);
  const modoLancamentos = modo === "lancamentos";
  const modoReceitas = modo === "receitas";
  const modoDespesas = modo === "despesas";
  const tituloFormulario = modoDespesas
    ? "Nova despesa"
    : modoReceitas
      ? "Nova receita"
      : "Novo lançamento";
  const tituloTabela = modoDespesas
    ? "Histórico de despesas"
    : modoReceitas
      ? "Histórico de receitas"
      : "Histórico de lançamentos";
  const lancamentosVisiveis = totais.lancamentosDoMes.filter((lancamento) => {
    if (modoReceitas) return lancamento.tipo === "entrada";
    if (modoDespesas) return lancamento.tipo === "despesa";
    return true;
  });
  const totalReceitas =
    Number(reservasPagasPeriodo || 0) +
    Number(mensalistasPagosPeriodo || 0) +
    totais.entradasManuais;
  const totalPendencias = pendenciasPagamento.reduce(
    (total, pendencia) => total + Number(pendencia.valor || 0),
    0
  );
  const lancamentosRecentes = [...totais.lancamentosDoMes]
    .sort((a, b) => {
      const dataA = `${a.data_lancamento || ""} ${a.created_at || ""}`;
      const dataB = `${b.data_lancamento || ""} ${b.created_at || ""}`;
      return dataB.localeCompare(dataA);
    })
    .slice(0, 5);

  if (!modoLancamentos && !modoReceitas && !modoDespesas) {
    return (
      <FinanceiroOverview
        mesAno={mesAno}
        mesAnoLabel={mesAnoLabel}
        onMesAnoChange={setMesAno}
        resumo={resumo}
        faturamentoAno={faturamentoAno}
        totais={totais}
        reservasPagasPeriodo={reservasPagasPeriodo}
        mensalistasPagosPeriodo={mensalistasPagosPeriodo}
        totalReceitas={totalReceitas}
        totalPendencias={totalPendencias}
        quantidadePendencias={pendenciasPagamento.length}
        lancamentosRecentes={lancamentosRecentes}
        evolucaoMensal={evolucaoMensal}
        evolucaoCarregando={evolucaoCarregando}
        evolucaoErro={evolucaoErro}
        onIrParaAba={onIrParaAba}
      />
    );
  }

  return (
    <section className="financeiro-profissional">
      <div className="financeiro-profissional-header">
        <div className="financeiro-profissional-heading">
          <p>Controle financeiro completo da sua arena</p>
        </div>

        <label className="financeiro-profissional-filter">
          <span className="financeiro-profissional-filter-icon" aria-hidden="true">
            <FinanceiroIcon name="calendar" />
          </span>
          <span className="financeiro-profissional-filter-copy">
            <span>Mês e ano</span>
            <strong>{mesAnoLabel}</strong>
            <Input
              type="month"
              aria-label="Selecionar mês e ano"
              value={mesAno}
              onChange={(event) => setMesAno(event.target.value)}
            />
          </span>
        </label>
      </div>

      <div className="financeiro-profissional-summary">
        {cardsResumo.map((card) => (
          <ResumoCard
            key={card.titulo}
            titulo={card.titulo}
            valor={card.valor}
            tipo={card.tipo}
            icone={card.icone}
          />
        ))}
      </div>

      <Card
        as="article"
        className={`financeiro-profissional-balance ${
          totais.saldoLiquido >= 0 ? "is-positive" : "is-negative"
        }`}
      >
        <span className="financeiro-profissional-balance-icon" aria-hidden="true">
          <FinanceiroIcon name="wallet" />
        </span>
        <div>
          <span>Saldo líquido</span>
          <strong>{moeda(totais.saldoLiquido)}</strong>
        </div>
      </Card>

      {!modoLancamentos && !modoReceitas && !modoDespesas && (
        <div className="financeiro-profissional-overview-note">
          <strong>Resumo do mês</strong>
          <span>Reservas pagas, entradas manuais, despesas e saldo do período.</span>
        </div>
      )}

      <div className="financeiro-profissional-layout">
        <Card
          as="form"
          className="financeiro-profissional-card"
          onSubmit={salvarLancamento}
        >
          <div className="financeiro-profissional-card-header">
            <h3>{tituloFormulario}</h3>
            {lancamentoEditandoId && (
              <Button type="button" onClick={limparFormulario}>
                Cancelar edição
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
              <span>Descrição</span>
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
              <span>Observação</span>
              <Textarea
                value={formulario.observacao}
                onChange={(event) => atualizarCampo("observacao", event.target.value)}
                placeholder="Detalhes internos do lançamento"
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
              Carregando resumo financeiro do período...
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
                ? "Salvar alterações"
                : "Adicionar lançamento"}
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
            <span>Resumo do mês</span>
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
              {fechamentoSalvando ? "Fechando..." : "Fechar mês"}
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
          <h3>{tituloTabela}</h3>
          <span>{lancamentosVisiveis.length} no mês</span>
        </div>

        {lancamentosCarregando && (
          <LoadingState className="financeiro-profissional-loading">
            Carregando lançamentos manuais...
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
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Forma de pagamento</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!lancamentosCarregando &&
                lancamentosVisiveis.map((lancamento) => (
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
                        "Categoria não encontrada"}
                    </td>
                    <td>
                      {formasPagamentoPorId[lancamento.forma_pagamento_id]?.nome ||
                        "Forma não encontrada"}
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

              {!lancamentosCarregando && lancamentosVisiveis.length === 0 && (
                <tr>
                  <td colSpan="7" className="financeiro-profissional-empty">
                    Nenhum lançamento manual neste mês.
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

function ResumoCard({ titulo, valor, tipo = "reservas", icone = "calendar" }) {
  return (
    <Card
      as="article"
      className={`financeiro-profissional-summary-card is-${tipo}`}
    >
      <span className="financeiro-profissional-summary-icon" aria-hidden="true">
        <FinanceiroIcon name={icone} />
      </span>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </Card>
  );
}

function FinanceiroOverview({
  mesAno,
  mesAnoLabel,
  onMesAnoChange,
  resumo,
  faturamentoAno,
  totais,
  reservasPagasPeriodo,
  mensalistasPagosPeriodo,
  totalReceitas,
  totalPendencias,
  quantidadePendencias,
  lancamentosRecentes,
  evolucaoMensal,
  evolucaoCarregando,
  evolucaoErro,
  onIrParaAba,
}) {
  const saldoPositivo = totais.saldoLiquido >= 0;
  const jogos = Number(resumo?.jogos || 0);
  const jogosPagos = Number(resumo?.pagos || 0);
  const faturamento = Number(faturamentoAno || 0);
  const receitaPartes = [
    { label: "Reservas", valor: Number(reservasPagasPeriodo || 0), cor: "#7c3aed" },
    { label: "Entradas manuais", valor: Number(totais.entradasManuais || 0), cor: "#22c55e" },
    { label: "Mensalistas", valor: Number(mensalistasPagosPeriodo || 0), cor: "#a855f7" },
  ];
  const donut = criarDonut(receitaPartes, totalReceitas);
  const alturaMaxima = Math.max(totalReceitas, totais.despesas, Math.abs(totais.saldoLiquido), 1);
  const evolucaoTotais = calcularTotaisEvolucao(evolucaoMensal);
  const saude = obterSaudeFinanceira({
    saldo: totais.saldoLiquido,
    receitas: totalReceitas,
    despesas: totais.despesas,
    pendencias: totalPendencias,
  });

  return (
    <section className="finance-overview">
      <header className="finance-overview-header">
        <div>
          <p>Controle financeiro completo da sua arena</p>
        </div>

        <label className="finance-overview-month">
          <span aria-hidden="true"><FinanceiroIcon name="calendar" /></span>
          <strong>{mesAnoLabel}</strong>
          <Input
            type="month"
            aria-label="Selecionar mês e ano"
            value={mesAno}
            onChange={(event) => onMesAnoChange(event.target.value)}
          />
        </label>
      </header>

      <div className="finance-kpi-grid">
        <FinanceKpi
          icon="wallet"
          label="Saldo líquido"
          value={moeda(totais.saldoLiquido)}
          tone={saldoPositivo ? "positive" : "negative"}
          meta="Saldo do mês"
        />
        <FinanceKpi
          icon="trend"
          label="Faturamento"
          value={moeda(faturamento)}
          tone="purple"
          meta="Total no ano"
        />
        <FinanceKpi
          icon="clock"
          label="Pendente"
          value={moeda(totalPendencias || Number(resumo?.pendenteMes || 0))}
          tone="warning"
          meta={`${quantidadePendencias} cobrança${quantidadePendencias === 1 ? "" : "s"}`}
        />
        <FinanceKpi
          icon="calendar"
          label="Jogos"
          value={jogos}
          tone="neutral"
          meta={`${jogosPagos} pagos`}
        />
      </div>

      <div className="finance-overview-grid is-main">
        <FinancePanel
          className="finance-panel-month"
          title="Resumo do mês"
          action="Ver detalhes do mês"
          onAction={() => onIrParaAba?.("lancamentos")}
          meta={mesAnoLabel}
        >
          <div className="finance-month-mini-grid">
            <FinanceMini label="Reservas pagas" value={moeda(reservasPagasPeriodo)} />
            <FinanceMini label="Entradas manuais" value={moeda(totais.entradasManuais)} />
            <FinanceMini label="Despesas" value={moeda(totais.despesas)} tone="negative" />
            <FinanceMini label="Saldo do mês" value={moeda(totais.saldoLiquido)} tone={saldoPositivo ? "positive" : "negative"} />
          </div>
        </FinancePanel>

        <FinancePanel className="finance-panel-evolution" title="Evolução financeira" meta="Últimos 6 meses">
          <div className="finance-evolution-toolbar" aria-label="Período da evolução financeira">
            <span>Últimos 6 meses</span>
            <strong>Entradas</strong>
            <strong>Saídas</strong>
            <strong>Saldo</strong>
          </div>
          <FinanceLineChart
            data={evolucaoMensal}
            loading={evolucaoCarregando}
            error={evolucaoErro}
          />
          <div className="finance-chart is-mobile-chart" aria-label="Resumo financeiro do mês selecionado">
            <ChartBar label="Entradas" value={totalReceitas} max={alturaMaxima} tone="purple" />
            <ChartBar label="Saídas" value={totais.despesas} max={alturaMaxima} tone="red" />
            <ChartBar label="Saldo" value={Math.abs(totais.saldoLiquido)} max={alturaMaxima} tone={saldoPositivo ? "green" : "red"} />
          </div>
          <div className="finance-chart-totals">
            <FinanceMini label="Total entradas" value={moeda(evolucaoTotais.entradas)} />
            <FinanceMini label="Total saídas" value={moeda(evolucaoTotais.saidas)} tone="negative" />
            <FinanceMini label="Saldo" value={moeda(evolucaoTotais.saldo)} tone={evolucaoTotais.saldo >= 0 ? "positive" : "negative"} />
          </div>
          <div className="finance-chart-totals is-mobile-totals">
            <FinanceMini label="Total entradas" value={moeda(totalReceitas)} />
            <FinanceMini label="Total saídas" value={moeda(totais.despesas)} tone="negative" />
            <FinanceMini label="Saldo" value={moeda(totais.saldoLiquido)} tone={saldoPositivo ? "positive" : "negative"} />
          </div>
        </FinancePanel>
      </div>

      <div className="finance-overview-grid">
        <FinancePanel
          className="finance-panel-revenue"
          title="Resumo de receitas"
          action="Ver todas as receitas"
          onAction={() => onIrParaAba?.("receitas")}
        >
          <div className="finance-revenue">
            <div className="finance-donut" style={{ "--finance-donut": donut }} />
            <div className="finance-revenue-list">
              <strong>{moeda(totalReceitas)}</strong>
              <span>Total receitas</span>
              {totalReceitas <= 0 && (
                <p className="finance-revenue-empty">Nenhuma receita registrada no mês.</p>
              )}
              {receitaPartes.map((item) => (
                <div
                  className={`finance-revenue-row${totalReceitas <= 0 ? " is-empty-total" : ""}`}
                  key={item.label}
                >
                  <i style={{ background: item.cor }} />
                  <span>{item.label}</span>
                  <b>{moeda(item.valor)}</b>
                </div>
              ))}
            </div>
          </div>
        </FinancePanel>

        <FinancePanel
          className="finance-panel-recent"
          title="Lançamentos recentes"
          action="Ver todos"
          onAction={() => onIrParaAba?.("lancamentos")}
        >
          <div className="finance-recent-list">
            {lancamentosRecentes.length === 0 ? (
              <div className="finance-recent-empty">
                <span aria-hidden="true"><FinanceiroIcon name="plus" /></span>
                <p>Nenhum lançamento manual recente.</p>
              </div>
            ) : (
              lancamentosRecentes.map((lancamento) => (
                <div className="finance-recent-item" key={lancamento.id}>
                  <span className={`finance-recent-icon is-${lancamento.tipo}`}>
                    <FinanceiroIcon name={lancamento.tipo === "despesa" ? "minus" : "plus"} />
                  </span>
                  <div>
                    <strong>{lancamento.descricao}</strong>
                    <small>{formatarData(lancamento.data_lancamento)}</small>
                  </div>
                  <b className={lancamento.tipo === "despesa" ? "is-negative" : "is-positive"}>
                    {lancamento.tipo === "despesa" ? "-" : "+"}{moeda(lancamento.valor)}
                  </b>
                </div>
              ))
            )}
          </div>
          <Button className="finance-overview-primary" type="button" onClick={() => onIrParaAba?.("lancamentos")}>
            + Novo lançamento
          </Button>
        </FinancePanel>
      </div>

      <div className="finance-overview-grid">
        <FinancePanel className="finance-panel-health" title="Saúde financeira">
          <div className={`finance-health is-${saude.tone}`}>
            <strong>{saude.label}</strong>
            <span>{saude.description}</span>
          </div>
          <div className="finance-health-metrics">
            <FinanceMini label="Liquidez" value={moeda(totais.saldoLiquido)} tone={saldoPositivo ? "positive" : "negative"} />
            <FinanceMini label="Rentabilidade" value={totalReceitas > 0 ? `${Math.round((totais.saldoLiquido / totalReceitas) * 100)}%` : "Sem receita"} />
          </div>
        </FinancePanel>

        <FinancePanel
          className="finance-panel-alerts"
          title="Alertas e pendências"
          action="Ver todas pendências"
          onAction={() => onIrParaAba?.("receitas")}
        >
          <div className="finance-alert-list">
            {quantidadePendencias > 0 ? (
              <div className="finance-alert-item">
                <span><FinanceiroIcon name="clock" /></span>
                <div>
                  <strong>{quantidadePendencias} cobrança{quantidadePendencias === 1 ? "" : "s"} pendente{quantidadePendencias === 1 ? "" : "s"}</strong>
                  <small>Valor total: {moeda(totalPendencias)}</small>
                </div>
              </div>
            ) : (
              <div className="finance-alert-item is-ok">
                <span><FinanceiroIcon name="check" /></span>
                <div>
                  <strong>Tudo em dia!</strong>
                  <small>Não há cobranças pendentes.</small>
                </div>
              </div>
            )}
          </div>
        </FinancePanel>
      </div>
    </section>
  );
}

function FinancePanel({ title, meta, action, onAction, className = "", children }) {
  return (
    <article className={`finance-panel ${className}`.trim()}>
      <header>
        <div>
          <h3>{title}</h3>
          {meta && <span>{meta}</span>}
        </div>
        {action && onAction && (
          <button type="button" onClick={onAction}>
            {action}
          </button>
        )}
      </header>
      {children}
    </article>
  );
}

function FinanceKpi({ icon, label, value, meta, tone }) {
  return (
    <article className={`finance-kpi is-${tone}`}>
      <span className="finance-kpi-icon"><FinanceiroIcon name={icon} /></span>
      <div className="finance-kpi-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    </article>
  );
}

function FinanceMini({ label, value, tone = "neutral" }) {
  return (
    <div className={`finance-mini is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChartBar({ label, value, max, tone }) {
  const height = Math.max(8, Math.round((Number(value || 0) / max) * 100));

  return (
    <div className={`finance-chart-bar is-${tone}`}>
      <div><span style={{ height: `${height}%` }} /></div>
      <strong>{moeda(value)}</strong>
      <small>{label}</small>
    </div>
  );
}

function FinanceLineChart({ data = [], loading, error }) {
  const serie = data.length ? data : criarSerieEvolucaoZerada(obterMesesEvolucao(obterMesAtual()));
  const valores = serie.flatMap((item) => [item.entradas, item.saidas, item.saldo, 0]);
  const maiorValor = Math.max(...valores);
  const menorValor = Math.min(...valores);
  const intervalo = maiorValor - menorValor || 1;
  const width = 620;
  const height = 188;
  const padding = { top: 16, right: 18, bottom: 34, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const linhasGuia = Array.from({ length: 4 }, (_, indice) =>
    maiorValor - (intervalo / 3) * indice
  );
  const seriesConfig = [
    { key: "entradas", label: "Entradas", color: "#7c3aed", strokeWidth: 3.4, markerRadius: 3.4 },
    { key: "saidas", label: "Saídas", color: "#dc2626", strokeWidth: 2.8, markerRadius: 3.2 },
    { key: "saldo", label: "Saldo", color: "#16a34a", strokeWidth: 2.6, markerRadius: 4.2, dash: "7 5" },
  ];
  const x = (indice) =>
    padding.left + (serie.length <= 1 ? 0 : (plotWidth / (serie.length - 1)) * indice);
  const y = (valor) =>
    padding.top + ((maiorValor - valor) / intervalo) * plotHeight;
  const path = (key) =>
    serie
      .map((item, indice) => `${indice === 0 ? "M" : "L"} ${x(indice)} ${y(item[key])}`)
      .join(" ");

  return (
    <div className="finance-line-chart" aria-label="Evolução financeira dos últimos 6 meses">
      {loading && <span className="finance-line-chart-status">Carregando evolução...</span>}
      {error && !loading && <span className="finance-line-chart-status is-error">{error}</span>}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden={loading || Boolean(error)}>
        {linhasGuia.map((valor, indice) => {
          const posY = y(valor);

          return (
            <g key={indice}>
              <line x1={padding.left} x2={width - padding.right} y1={posY} y2={posY} />
              <text x={0} y={posY + 4}>{formatarValorCurto(valor)}</text>
            </g>
          );
        })}

        {serie.map((item, indice) => (
          <text key={item.mesAno} className="finance-line-chart-month" x={x(indice)} y={height - 8}>
            {item.label}
          </text>
        ))}

        {seriesConfig.map((config) => (
          <g className={`finance-line-series is-${config.key}`} key={config.key}>
            <path
              d={path(config.key)}
              stroke={config.color}
              strokeDasharray={config.dash}
              strokeWidth={config.strokeWidth}
            />
            {serie.map((item, indice) => (
              <circle
                key={`${config.key}-${item.mesAno}`}
                cx={x(indice)}
                cy={y(item[config.key])}
                r={config.markerRadius}
                fill={config.key === "saldo" ? "#ffffff" : config.color}
                stroke={config.color}
                strokeWidth={config.key === "saldo" ? 2.4 : 0}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

function calcularTotaisEvolucao(data = []) {
  return data.reduce(
    (totais, item) => {
      totais.entradas += Number(item.entradas || 0);
      totais.saidas += Number(item.saidas || 0);
      totais.saldo += Number(item.saldo || 0);
      return totais;
    },
    { entradas: 0, saidas: 0, saldo: 0 }
  );
}

function formatarValorCurto(valor) {
  const numero = Number(valor || 0);
  const absoluto = Math.abs(numero);
  const sinal = numero < 0 ? "-" : "";

  if (absoluto >= 1000) {
    return `${sinal}R$ ${Math.round(absoluto / 1000)}k`;
  }

  return `${sinal}R$ ${Math.round(absoluto)}`;
}

function criarDonut(partes, total) {
  if (!partes.length || !total) return "rgba(237, 233, 254, 0.9) 0 100%";

  let inicio = 0;
  return partes
    .map((parte) => {
      const fim = inicio + (parte.valor / total) * 100;
      const segmento = `${parte.cor} ${inicio}% ${fim}%`;
      inicio = fim;
      return segmento;
    })
    .join(", ");
}

function obterSaudeFinanceira({ saldo, receitas, despesas, pendencias }) {
  if (receitas <= 0) {
    return {
      label: "Sem receita",
      tone: "neutral",
      description: "Ainda não há receita suficiente para avaliar o mês.",
    };
  }

  if (saldo >= 0 && pendencias === 0) {
    return {
      label: "Ótima",
      tone: "positive",
      description: "Receitas cobrem as despesas e não há cobranças pendentes.",
    };
  }

  if (saldo >= 0) {
    return {
      label: "Boa",
      tone: "positive",
      description: "Saldo positivo, com pendências a acompanhar.",
    };
  }

  return {
    label: "Atenção",
    tone: "warning",
    description: despesas > receitas
      ? "As despesas superam as receitas do mês."
      : "Há sinais financeiros que merecem acompanhamento.",
  };
}

function FinanceiroIcon({ name }) {
  const paths = {
    calendar: (
      <>
        <path d="M7 3v3" />
        <path d="M17 3v3" />
        <path d="M4 9h16" />
        <path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 19c0-2-2-4-4-4s-4 2-4 4" />
        <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M20 18c0-2-1-3-3-4" />
        <path d="M17 5a3 3 0 0 1 0 6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    wallet: (
      <>
        <path d="M19 7V6a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h13a1 1 0 0 1 1 1v6a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V7" />
        <path d="M16 14h.01" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 7-7" />
        <path d="M14 8h6v6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    check: (
      <>
        <path d="M20 6 9 17l-5-5" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || paths.calendar}
    </svg>
  );
}
