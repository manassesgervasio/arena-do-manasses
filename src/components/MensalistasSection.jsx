import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const statusLista = ["Ativo", "Pausado", "Cancelado"];
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

export default function MensalistasSection({ moeda }) {
  const competenciaAtual = obterCompetenciaAtual();
  const [mensalistas, setMensalistas] = useState([]);
  const [pagamentos, setPagamentos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [pagamentoSalvandoId, setPagamentoSalvandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novoMensalista, setNovoMensalista] = useState({
    nome: "",
    telefone: "",
    valorMensal: "",
    vencimento: "",
    status: "Ativo",
  });

  useEffect(() => {
    let ativo = true;

    async function carregarMensalistas() {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("mensalistas")
        .select("id,nome,telefone,valor_mensal,dia_vencimento,status")
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        setErro("Não foi possível carregar os mensalistas. Tente novamente em instantes.");
        setCarregando(false);
        return;
      }

      const mensalistasNormalizados = (data || []).map(normalizarMensalista);
      const mensalistaIds = mensalistasNormalizados.map((mensalista) => mensalista.id);
      const pagamentosPorMensalista = {};

      if (mensalistaIds.length > 0) {
        const { data: pagamentosData, error: pagamentosError } = await supabase
          .from("mensalista_pagamentos")
          .select(pagamentoSelect)
          .eq("competencia", competenciaAtual)
          .in("mensalista_id", mensalistaIds);

        if (!ativo) return;

        if (pagamentosError) {
          setErro("Não foi possível carregar os pagamentos dos mensalistas. Tente novamente em instantes.");
          setCarregando(false);
          return;
        }

        (pagamentosData || []).forEach((pagamento) => {
          pagamentosPorMensalista[pagamento.mensalista_id] = pagamento;
        });
      }

      setMensalistas(mensalistasNormalizados);
      setPagamentos(pagamentosPorMensalista);
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

  async function adicionarMensalista(event) {
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

    const { data, error } = await supabase
      .from("mensalistas")
      .insert([mensalistaBanco])
      .select("id,nome,telefone,valor_mensal,dia_vencimento,status")
      .single();

    setSalvando(false);

    if (error) {
      setErro("Não foi possível salvar o mensalista. Confira os dados e tente novamente.");
      return;
    }

    setMensalistas((anteriores) =>
      [normalizarMensalista(data), ...anteriores].sort((a, b) =>
        a.nome.localeCompare(b.nome)
      )
    );

    setNovoMensalista({
      nome: "",
      telefone: "",
      valorMensal: "",
      vencimento: "",
      status: "Ativo",
    });
    setMostrarFormulario(false);
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
  }

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
          onClick={() => setMostrarFormulario((valor) => !valor)}
        >
          {mostrarFormulario ? "Fechar" : "Novo mensalista"}
        </button>
      </div>

      {erro && <p className="mensalistas-error">{erro}</p>}

      {mostrarFormulario && (
        <form className="mensalistas-form" onSubmit={adicionarMensalista}>
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
          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </form>
      )}

      {carregando ? (
        <div className="mensalistas-empty">Carregando mensalistas...</div>
      ) : (
        <div className="mensalistas-grid">
          {mensalistas.length === 0 && (
            <div className="mensalistas-empty">Nenhum mensalista cadastrado.</div>
          )}

          {mensalistas.map((mensalista) => (
            <article className="mensalista-card" key={mensalista.id}>
              {(() => {
                const situacao = obterSituacaoMensal(mensalista);
                const estaPago = situacao === "Pago";

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
