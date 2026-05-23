import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { diasSemana, horarios } from "../constants";

const statusLista = ["Ativo", "Pausado", "Cancelado"];
const situacaoLista = ["Pago", "Pendente", "Vencido"];
const mensalistaSelect = "id,nome,telefone,valor_mensal,dia_vencimento,status";
const horarioContratadoSelect = "id,mensalista_id,dia_semana,horario,ativo";
const pagamentoSelect =
  "id,mensalista_id,competencia,valor,data_vencimento,situacao,data_pagamento";

function obterCompetenciaAtual() {
  const hoje = new Date();

  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function obterDataHoje() {
  return new Date().toISOString().split("T")[0];
}

function obterDataVencimento(competencia, diaVencimento) {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dia = Math.min(Number(diaVencimento || 1), ultimoDia);

  return `${competencia}-${String(dia).padStart(2, "0")}`;
}

function formatarDataCurta(dataTexto) {
  if (!dataTexto) return "-";

  const [ano, mes, dia] = dataTexto.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarMensalista(mensalista) {
  return {
    id: mensalista.id,
    nome: mensalista.nome || "",
    telefone: mensalista.telefone || "",
    valorMensal: Number(mensalista.valor_mensal || 0),
    vencimento: Number(mensalista.dia_vencimento || 1),
    status: mensalista.status || "Ativo",
  };
}

function criarFormularioVazio() {
  return {
    nome: "",
    telefone: "",
    valorMensal: "",
    vencimento: "",
    status: "Ativo",
    diaSemana: "1",
    horario: horarios[0],
  };
}

export default function MensalistasSection({
  moeda,
  perfilLogado,
  onMensalistasChange,
}) {
  const competenciaAtual = obterCompetenciaAtual();
  const podeExcluirMensalista = perfilLogado === "Administrador";
  const [mensalistas, setMensalistas] = useState([]);
  const [horariosContratados, setHorariosContratados] = useState({});
  const [pagamentos, setPagamentos] = useState({});
  const [historicoPagamentos, setHistoricoPagamentos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [pagamentoSalvandoId, setPagamentoSalvandoId] = useState(null);
  const [pagamentoExcluindoId, setPagamentoExcluindoId] = useState(null);
  const [mensalistaExcluindoId, setMensalistaExcluindoId] = useState(null);
  const [erro, setErro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroSituacao, setFiltroSituacao] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensalistaEditandoId, setMensalistaEditandoId] = useState(null);
  const [novoMensalista, setNovoMensalista] = useState(criarFormularioVazio);

  useEffect(() => {
    let ativo = true;

    async function carregarMensalistas() {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("mensalistas")
        .select(mensalistaSelect)
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        setErro("Não foi possível carregar os mensalistas. Tente novamente em instantes.");
        setCarregando(false);
        return;
      }

      const mensalistasNormalizados = (data || []).map(normalizarMensalista);
      const mensalistaIds = mensalistasNormalizados.map((mensalista) => mensalista.id);
      const pagamentosAtuais = {};
      const historicoPorMensalista = {};
      const horariosPorMensalista = {};

      if (mensalistaIds.length > 0) {
        const [
          { data: pagamentosData, error: pagamentosError },
          { data: horariosData, error: horariosError },
        ] = await Promise.all([
          supabase
          .from("mensalista_pagamentos")
          .select(pagamentoSelect)
          .in("mensalista_id", mensalistaIds)
            .order("competencia", { ascending: false }),
          supabase
            .from("mensalista_horarios")
            .select(horarioContratadoSelect)
            .in("mensalista_id", mensalistaIds)
            .eq("ativo", true),
        ]);

        if (!ativo) return;

        if (pagamentosError) {
          setErro("Não foi possível carregar os pagamentos dos mensalistas. Tente novamente em instantes.");
          setCarregando(false);
          return;
        }

        if (horariosError) {
          setErro("Não foi possível carregar os horários contratados. Tente novamente em instantes.");
          setCarregando(false);
          return;
        }

        (pagamentosData || []).forEach((pagamento) => {
          if (!historicoPorMensalista[pagamento.mensalista_id]) {
            historicoPorMensalista[pagamento.mensalista_id] = [];
          }

          historicoPorMensalista[pagamento.mensalista_id].push(pagamento);

          if (pagamento.competencia === competenciaAtual) {
            pagamentosAtuais[pagamento.mensalista_id] = pagamento;
          }
        });

        (horariosData || []).forEach((horarioContratado) => {
          if (!horariosPorMensalista[horarioContratado.mensalista_id]) {
            horariosPorMensalista[horarioContratado.mensalista_id] =
              horarioContratado;
          }
        });
      }

      setMensalistas(mensalistasNormalizados);
      setHorariosContratados(horariosPorMensalista);
      setPagamentos(pagamentosAtuais);
      setHistoricoPagamentos(historicoPorMensalista);
      setCarregando(false);
    }

    carregarMensalistas();

    return () => {
      ativo = false;
    };
  }, [competenciaAtual]);

  function atualizarCampo(campo, valor) {
    setNovoMensalista((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function limparFormularioMensalista() {
    setNovoMensalista(criarFormularioVazio());
    setMensalistaEditandoId(null);
  }

  function iniciarEdicao(mensalista) {
    setErro("");
    setNovoMensalista({
      nome: mensalista.nome,
      telefone: mensalista.telefone,
      valorMensal: String(mensalista.valorMensal),
      vencimento: String(mensalista.vencimento),
      status: mensalista.status,
      diaSemana: String(horariosContratados[mensalista.id]?.dia_semana ?? 1),
      horario: horariosContratados[mensalista.id]?.horario || horarios[0],
    });
    setMensalistaEditandoId(mensalista.id);
    setMostrarFormulario(true);
  }

  async function salvarMensalista(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    const mensalistaBanco = {
      nome: novoMensalista.nome.trim(),
      telefone: novoMensalista.telefone.trim(),
      valor_mensal: Number(novoMensalista.valorMensal || 0),
      dia_vencimento: Number(novoMensalista.vencimento || 1),
      status: novoMensalista.status,
    };

    const operacao = mensalistaEditandoId
      ? supabase
          .from("mensalistas")
          .update(mensalistaBanco)
          .eq("id", mensalistaEditandoId)
      : supabase.from("mensalistas").insert([mensalistaBanco]);

    const { data, error } = await operacao.select(mensalistaSelect).single();

    if (error) {
      setSalvando(false);
      setErro("Não foi possível salvar o mensalista. Confira os dados e tente novamente.");
      return;
    }

    const mensalistaSalvo = normalizarMensalista(data);
    const horarioAtual = horariosContratados[mensalistaSalvo.id];
    const horarioBanco = {
      mensalista_id: mensalistaSalvo.id,
      dia_semana: Number(novoMensalista.diaSemana),
      horario: novoMensalista.horario,
      ativo: true,
    };

    const horarioOperacao = horarioAtual?.id
      ? supabase
          .from("mensalista_horarios")
          .update(horarioBanco)
          .eq("id", horarioAtual.id)
      : supabase.from("mensalista_horarios").insert([horarioBanco]);

    const { data: horarioData, error: horarioError } = await horarioOperacao
      .select(horarioContratadoSelect)
      .single();

    if (horarioError) {
      setSalvando(false);
      setErro("Mensalista salvo, mas não foi possível salvar o horário contratado.");
      return;
    }

    setMensalistas((anteriores) =>
      [
        mensalistaSalvo,
        ...anteriores.filter((mensalista) => mensalista.id !== mensalistaSalvo.id),
      ].sort((a, b) => a.nome.localeCompare(b.nome))
    );
    setHorariosContratados((anteriores) => ({
      ...anteriores,
      [mensalistaSalvo.id]: horarioData,
    }));

    limparFormularioMensalista();
    setMostrarFormulario(false);
    setSalvando(false);
    onMensalistasChange?.();
  }

  function obterSituacaoMensal(mensalista) {
    const pagamento = pagamentos[mensalista.id];

    if (pagamento?.situacao) {
      return pagamento.situacao;
    }

    const dataVencimento = obterDataVencimento(
      competenciaAtual,
      mensalista.vencimento
    );

    return obterDataHoje() > dataVencimento ? "Vencido" : "Pendente";
  }

  function atualizarHistoricoPagamento(mensalistaId, pagamentoAtualizado) {
    setHistoricoPagamentos((anteriores) => {
      const historicoAtual = anteriores[mensalistaId] || [];
      const proximosPagamentos = [
        pagamentoAtualizado,
        ...historicoAtual.filter((pagamento) => pagamento.id !== pagamentoAtualizado.id),
      ].sort((a, b) => b.competencia.localeCompare(a.competencia));

      return {
        ...anteriores,
        [mensalistaId]: proximosPagamentos,
      };
    });
  }

  async function marcarMensalidadeComoPaga(mensalista) {
    setErro("");
    setPagamentoSalvandoId(mensalista.id);

    const pagamentoAtual = pagamentos[mensalista.id];
    const pagamentoBanco = {
      mensalista_id: mensalista.id,
      competencia: competenciaAtual,
      valor: mensalista.valorMensal,
      data_vencimento: obterDataVencimento(competenciaAtual, mensalista.vencimento),
      situacao: "Pago",
      data_pagamento: obterDataHoje(),
    };

    const resultado = pagamentoAtual?.id
      ? await supabase
          .from("mensalista_pagamentos")
          .update(pagamentoBanco)
          .eq("id", pagamentoAtual.id)
          .select(pagamentoSelect)
          .single()
      : await supabase
          .from("mensalista_pagamentos")
          .insert([pagamentoBanco])
          .select(pagamentoSelect)
          .single();

    setPagamentoSalvandoId(null);

    if (resultado.error) {
      setErro("Não foi possível marcar a mensalidade como paga. Tente novamente.");
      return;
    }

    setPagamentos((anteriores) => ({
      ...anteriores,
      [mensalista.id]: resultado.data,
    }));
    atualizarHistoricoPagamento(mensalista.id, resultado.data);
  }

  async function excluirMensalista(mensalista) {
    if (!podeExcluirMensalista) {
      setErro("Apenas administradores podem excluir mensalistas.");
      return;
    }

    const confirmar = confirm(
      `Excluir definitivamente "${mensalista.nome}" e todo o histórico de pagamentos?`
    );

    if (!confirmar) return;

    const senha = prompt("Digite a senha de administrador para excluir o mensalista:");

    if (senha !== "1234") {
      alert("Senha incorreta.");
      return;
    }

    setErro("");
    setMensalistaExcluindoId(mensalista.id);

    const { error } = await supabase
      .from("mensalistas")
      .delete()
      .eq("id", mensalista.id);

    setMensalistaExcluindoId(null);

    if (error) {
      setErro("Não foi possível excluir o mensalista. Tente novamente.");
      return;
    }

    setMensalistas((anteriores) =>
      anteriores.filter((item) => item.id !== mensalista.id)
    );
    setPagamentos((anteriores) => {
      const proximos = { ...anteriores };
      delete proximos[mensalista.id];
      return proximos;
    });
    setHorariosContratados((anteriores) => {
      const proximos = { ...anteriores };
      delete proximos[mensalista.id];
      return proximos;
    });
    setHistoricoPagamentos((anteriores) => {
      const proximos = { ...anteriores };
      delete proximos[mensalista.id];
      return proximos;
    });
    onMensalistasChange?.();
  }

  async function excluirPagamentoMensal(mensalista) {
    const pagamento = pagamentos[mensalista.id];

    if (!pagamento?.id) return;

    const confirmar = confirm(
      `Excluir o pagamento de ${competenciaAtual} de "${mensalista.nome}"?`
    );

    if (!confirmar) return;

    setErro("");
    setPagamentoExcluindoId(mensalista.id);

    const { error } = await supabase
      .from("mensalista_pagamentos")
      .delete()
      .eq("id", pagamento.id);

    setPagamentoExcluindoId(null);

    if (error) {
      setErro("Não foi possível excluir o pagamento mensal. Tente novamente.");
      return;
    }

    setPagamentos((anteriores) => {
      const proximos = { ...anteriores };
      delete proximos[mensalista.id];
      return proximos;
    });
    setHistoricoPagamentos((anteriores) => ({
      ...anteriores,
      [mensalista.id]: (anteriores[mensalista.id] || []).filter(
        (item) => item.id !== pagamento.id
      ),
    }));
  }

  const resumoMensalistas = mensalistas.reduce(
    (resumo, mensalista) => {
      if (mensalista.status === "Ativo") {
        resumo.ativos += 1;
        resumo.previsto += mensalista.valorMensal;
      }

      const situacao = obterSituacaoMensal(mensalista);

      if (situacao === "Pago") {
        resumo.pago += mensalista.valorMensal;
      }

      if (situacao === "Pendente") {
        resumo.pendente += mensalista.valorMensal;
      }

      if (situacao === "Vencido") {
        resumo.vencido += mensalista.valorMensal;
      }

      return resumo;
    },
    {
      previsto: 0,
      pago: 0,
      pendente: 0,
      vencido: 0,
      ativos: 0,
    }
  );

  const mensalistasFiltrados = mensalistas.filter((mensalista) => {
    const statusOk =
      filtroStatus === "Todos" || mensalista.status === filtroStatus;
    const situacao = obterSituacaoMensal(mensalista);
    const situacaoOk =
      filtroSituacao === "Todos" || situacao === filtroSituacao;

    return statusOk && situacaoOk;
  });

  return (
    <section className="mensalistas-section">
      <div className="mensalistas-header">
        <div>
          <h2>Mensalistas</h2>
          <p>Mensalidades de {competenciaAtual}, sem agenda e sem resumo financeiro</p>
        </div>

        <button
          type="button"
          className="mensalistas-primary-button"
          onClick={() => {
            if (mostrarFormulario) {
              limparFormularioMensalista();
            }

            setMostrarFormulario((valor) => !valor);
          }}
        >
          {mostrarFormulario ? "Fechar" : "Novo mensalista"}
        </button>
      </div>

      {erro && <p className="mensalistas-error">{erro}</p>}

      <div className="mensalistas-summary-grid">
        <ResumoMensalistaCard
          titulo="Total mensal previsto"
          valor={moeda(resumoMensalistas.previsto)}
        />
        <ResumoMensalistaCard
          titulo="Total pago"
          valor={moeda(resumoMensalistas.pago)}
        />
        <ResumoMensalistaCard
          titulo="Total pendente"
          valor={moeda(resumoMensalistas.pendente)}
        />
        <ResumoMensalistaCard
          titulo="Total vencido"
          valor={moeda(resumoMensalistas.vencido)}
        />
        <ResumoMensalistaCard
          titulo="Mensalistas ativos"
          valor={resumoMensalistas.ativos}
        />
      </div>

      {mostrarFormulario && (
        <form className="mensalistas-form" onSubmit={salvarMensalista}>
          <input
            type="text"
            placeholder="Nome"
            value={novoMensalista.nome}
            onChange={(event) => atualizarCampo("nome", event.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={novoMensalista.telefone}
            onChange={(event) => atualizarCampo("telefone", event.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="Valor mensal"
            value={novoMensalista.valorMensal}
            onChange={(event) =>
              atualizarCampo("valorMensal", event.target.value)
            }
            required
          />
          <input
            type="number"
            min="1"
            max="31"
            placeholder="Dia do vencimento"
            value={novoMensalista.vencimento}
            onChange={(event) =>
              atualizarCampo("vencimento", event.target.value)
            }
            required
          />
          <select
            value={novoMensalista.status}
            onChange={(event) => atualizarCampo("status", event.target.value)}
          >
            {statusLista.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            value={novoMensalista.diaSemana}
            onChange={(event) => atualizarCampo("diaSemana", event.target.value)}
          >
            {diasSemana.map((dia, index) => (
              <option key={dia} value={index}>
                {dia}
              </option>
            ))}
          </select>
          <select
            value={novoMensalista.horario}
            onChange={(event) => atualizarCampo("horario", event.target.value)}
          >
            {horarios.map((horario) => (
              <option key={horario} value={horario}>
                {horario}
              </option>
            ))}
          </select>
          <button type="submit" disabled={salvando}>
            {salvando
              ? "Salvando..."
              : mensalistaEditandoId
              ? "Salvar alterações"
              : "Adicionar"}
          </button>
        </form>
      )}

      <div className="mensalistas-filters" aria-label="Filtros de mensalistas">
        <label>
          <span>Status</span>
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
          >
            <option>Todos</option>
            {statusLista.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Situação financeira</span>
          <select
            value={filtroSituacao}
            onChange={(event) => setFiltroSituacao(event.target.value)}
          >
            <option>Todos</option>
            {situacaoLista.map((situacao) => (
              <option key={situacao}>{situacao}</option>
            ))}
          </select>
        </label>
      </div>

      {carregando ? (
        <div className="mensalistas-empty">Carregando mensalistas...</div>
      ) : (
        <div className="mensalistas-grid">
          {mensalistasFiltrados.length === 0 && (
            <div className="mensalistas-empty">Nenhum mensalista encontrado.</div>
          )}

          {mensalistasFiltrados.map((mensalista) => (
            <article className="mensalista-card" key={mensalista.id}>
              {(() => {
                const situacao = obterSituacaoMensal(mensalista);
                const estaPago = situacao === "Pago";
                const temPagamentoMensal = Boolean(pagamentos[mensalista.id]?.id);
                const horarioContratado = horariosContratados[mensalista.id];
                const historico = (historicoPagamentos[mensalista.id] || []).filter(
                  (pagamento) => pagamento.competencia !== competenciaAtual
                );

                return (
                  <>
                    <div className="mensalista-card-header">
                      <div>
                        <h3>{mensalista.nome}</h3>
                        <p>{mensalista.telefone || "Sem telefone"}</p>
                      </div>
                      <span
                        className={`mensalista-badge mensalista-badge-${mensalista.status.toLowerCase()}`}
                      >
                        {mensalista.status}
                      </span>
                    </div>

                    <div className="mensalista-info-grid">
                      <Info
                        label="Valor mensal"
                        value={moeda(mensalista.valorMensal)}
                      />
                      <Info
                        label="Vencimento"
                        value={`Dia ${mensalista.vencimento}`}
                      />
                      <Info
                        label="Dia contratado"
                        value={
                          horarioContratado
                            ? diasSemana[horarioContratado.dia_semana]
                            : "Sem dia"
                        }
                      />
                      <Info
                        label="Horario contratado"
                        value={horarioContratado?.horario || "Sem horario"}
                      />
                    </div>

                    <div className="mensalista-payment-row">
                      <span
                        className={`mensalista-situacao mensalista-situacao-${situacao.toLowerCase()}`}
                      >
                        {situacao}
                      </span>

                      <button
                        type="button"
                        className="mensalista-payment-button"
                        disabled={estaPago || pagamentoSalvandoId === mensalista.id}
                        onClick={() => marcarMensalidadeComoPaga(mensalista)}
                      >
                        {pagamentoSalvandoId === mensalista.id
                          ? "Salvando..."
                          : estaPago
                          ? "Mensalidade paga"
                          : "Marcar como pago"}
                      </button>
                    </div>

                    <section className="mensalista-history">
                      <h4>Histórico de pagamentos</h4>
                      {historico.length === 0 ? (
                        <p>Nenhum pagamento anterior.</p>
                      ) : (
                        <div className="mensalista-history-list">
                          {historico.map((pagamento) => (
                            <div
                              className="mensalista-history-item"
                              key={pagamento.id}
                            >
                              <span>{pagamento.competencia}</span>
                              <strong>{moeda(pagamento.valor)}</strong>
                              <span>{pagamento.situacao}</span>
                              <span>{formatarDataCurta(pagamento.data_vencimento)}</span>
                              <span>{formatarDataCurta(pagamento.data_pagamento)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <button
                      type="button"
                      className="mensalista-edit-button"
                      onClick={() => iniciarEdicao(mensalista)}
                    >
                      Editar mensalista
                    </button>

                    {podeExcluirMensalista && (
                      <button
                        type="button"
                        className="mensalista-delete-button"
                        disabled={mensalistaExcluindoId === mensalista.id}
                        onClick={() => excluirMensalista(mensalista)}
                      >
                        {mensalistaExcluindoId === mensalista.id
                          ? "Excluindo..."
                          : "Excluir mensalista"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="mensalista-delete-payment-button"
                      disabled={
                        !temPagamentoMensal ||
                        pagamentoExcluindoId === mensalista.id
                      }
                      onClick={() => excluirPagamentoMensal(mensalista)}
                    >
                      {pagamentoExcluindoId === mensalista.id
                        ? "Excluindo..."
                        : temPagamentoMensal
                        ? "Excluir pagamento mensal"
                        : "Sem pagamento mensal"}
                    </button>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="mensalista-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResumoMensalistaCard({ titulo, valor }) {
  return (
    <div className="mensalistas-summary-card">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}
