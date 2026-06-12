import { useState } from "react";
import ReservaBadges from "./ReservaBadges";
import { Button, Input, Select } from "./ui";

export default function HorarioCard({
  item,
  hora,
  mensalistaContratado,
  tipoLista,
  statusLista,
  expandido,
  compactoLivre,
  onToggleExpandido,
  onClienteChange,
  onTelefoneChange,
  onValorChange,
  onTipoChange,
  onStatusChange,
  onReservar,
  onSolicitarReservaPublica,
  onAlugarComoAvulso,
  onLimpar,
  modoPublico,
  dataFormatada,
  reservaIndisponivel,
}) {
  const [mostrandoAluguelAvulso, setMostrandoAluguelAvulso] = useState(false);
  const [salvandoAluguelAvulso, setSalvandoAluguelAvulso] = useState(false);
  const [aluguelAvulso, setAluguelAvulso] = useState({
    cliente: "",
    telefone: "",
    valor: "",
    status: "Reservado",
  });
  const [solicitacaoPublica, setSolicitacaoPublica] = useState({
    nome: "",
    telefone: "",
  });
  const [whatsappPublicoUrl, setWhatsappPublicoUrl] = useState("");
  const [enviandoSolicitacaoPublica, setEnviandoSolicitacaoPublica] =
    useState(false);

  function atualizarAluguelAvulso(campo, valor) {
    setAluguelAvulso((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function limparAluguelAvulso() {
    setAluguelAvulso({
      cliente: "",
      telefone: "",
      valor: "",
      status: "Reservado",
    });
    setMostrandoAluguelAvulso(false);
  }

  function atualizarSolicitacaoPublica(campo, valor) {
    setSolicitacaoPublica((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvarAluguelAvulso() {
    if (!aluguelAvulso.cliente.trim()) {
      alert("Informe o nome do cliente/time para alugar este horario.");
      return;
    }

    setSalvandoAluguelAvulso(true);
    const mensagemErro = await onAlugarComoAvulso?.(aluguelAvulso);
    setSalvandoAluguelAvulso(false);

    if (mensagemErro) {
      alert(mensagemErro);
      return;
    }

    limparAluguelAvulso();
  }

  async function confirmarSolicitacaoPublica(event) {
    event.preventDefault();

    const nome = solicitacaoPublica.nome.trim();
    const telefone = solicitacaoPublica.telefone.replace(/\D/g, "");

    if (nome.length < 3) {
      alert("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    if (telefone.length < 10) {
      alert("Informe um telefone/WhatsApp com pelo menos 10 digitos.");
      return;
    }

    setEnviandoSolicitacaoPublica(true);
    const resultado = await onSolicitarReservaPublica?.({ nome, telefone });
    setEnviandoSolicitacaoPublica(false);

    if (!resultado?.ok) {
      setWhatsappPublicoUrl("");
      alert(
        resultado?.mensagem ||
          "Nao foi possivel enviar a solicitacao. Tente novamente."
      );
      return;
    }

    setSolicitacaoPublica({ nome: "", telefone: "" });
    setWhatsappPublicoUrl(resultado.whatsappUrl || "");
    alert(resultado.mensagem || "Reserva pendente criada com sucesso.");
  }

  const statusAvulsoLista = statusLista.filter((status) => status !== "Livre");
  const statusIcones = {
    Livre: "",
    Reservado: "",
    Pago: "",
    Pendente: "",
    Cancelado: "",
    Faltou: "",
  };
  const statusVisual = mensalistaContratado
    ? "Mensalista"
    : item.status || "Livre";
  const statusSelo = mensalistaContratado
    ? "MENSALISTA"
    : item.tipo === "Fixo"
    ? "FIXO"
    : item.status === "Pago"
    ? "PAGO"
    : item.status === "Pendente"
    ? "PENDENTE"
    : item.status === "Reservado"
    ? "RESERVADO"
    : item.status === "Cancelado"
    ? "CANCELADO"
    : item.status === "Faltou"
    ? "FALTOU"
    : "";
  const statusIcone = mensalistaContratado
    ? ""
    : item.tipo === "Fixo"
    ? ""
    : statusIcones[item.status] || "";
  const statusClasse = String(item.status || "Livre").toLowerCase();
  const tituloResumo =
    mensalistaContratado?.nome || item.cliente || "Disponivel";
  const podeReservarWhatsApp =
    modoPublico && compactoLivre && !mensalistaContratado && !reservaIndisponivel;
  const horarioPublicoOcupado =
    modoPublico && !podeReservarWhatsApp && !reservaIndisponivel;
  const cardClasse = [
    "horario-card",
    `horario-card-${statusClasse}`,
    item.tipo === "Fixo" ? "horario-card-fixo" : "",
    compactoLivre ? "horario-card-livre-compacto" : "",
    mensalistaContratado ? "horario-card-mensalista" : "",
    expandido ? "is-expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function alternarPeloCard(event) {
    if (event.target.closest("button, input, select, textarea, a")) return;
    onToggleExpandido?.();
  }

  return (
    <div className={cardClasse} onClick={alternarPeloCard}>
      <Button
        className="horario-compact-button horario-card-time"
        type="button"
        onClick={onToggleExpandido}
        aria-expanded={expandido}
        aria-label={`${expandido ? "Fechar" : "Abrir"} horario ${hora}`}
      >
        <span className="horario-card-meta">
          <span className="horario-card-hour">
            {expandido && statusIcone ? `${statusIcone} ` : ""}
            {hora.split(" - ")[0]}
          </span>
          <span className="horario-card-toggle-icon" aria-hidden="true">
            {expandido ? "▲" : "▼"}
          </span>
        </span>

        <strong className="horario-card-title">{tituloResumo}</strong>

        {!expandido && statusSelo && (
          <span className="horario-status-pill horario-status-pill-row">
            {statusSelo}
          </span>
        )}

        {expandido && !modoPublico && (
          <span className="horario-card-expanded-summary">
            <span>{statusVisual}</span>
            {item.valor ? <span>R$ {item.valor}</span> : null}
          </span>
        )}

        {expandido && !modoPublico && <ReservaBadges tipo={item.tipo} />}
      </Button>

      {expandido && modoPublico && (
        <div className="horario-card-public-details">
          {podeReservarWhatsApp && (
            <div>
              <strong>{tituloResumo}</strong>
              {statusSelo && <span>{statusSelo}</span>}
            </div>
          )}

          {horarioPublicoOcupado && (
            <div className="horario-public-occupied">
              <strong>Este horário já está reservado</strong>
              <span>{statusSelo || "OCUPADO"}</span>
            </div>
          )}

          {podeReservarWhatsApp && (
            <form
              className="public-reserva-form"
              onSubmit={confirmarSolicitacaoPublica}
            >
              <Input
                className="horario-card-input"
                placeholder="Nome"
                value={solicitacaoPublica.nome}
                onChange={(event) =>
                  atualizarSolicitacaoPublica("nome", event.target.value)
                }
              />
              <Input
                className="horario-card-input"
                placeholder="Telefone/WhatsApp"
                inputMode="tel"
                value={solicitacaoPublica.telefone}
                onChange={(event) =>
                  atualizarSolicitacaoPublica("telefone", event.target.value)
                }
              />
              <Button
                className="whatsapp-reserva-button"
                type="submit"
                disabled={enviandoSolicitacaoPublica}
                variant="primary"
              >
                {enviandoSolicitacaoPublica
                  ? "Enviando..."
                  : "Agendar e enviar WhatsApp"}
              </Button>
            </form>
          )}

          {reservaIndisponivel && compactoLivre && (
            <span className="horario-public-unavailable">
              Indisponivel para reserva
            </span>
          )}

          {whatsappPublicoUrl && (
            <Button
              as="a"
              className="whatsapp-reserva-button"
              href={whatsappPublicoUrl}
              target="_blank"
              rel="noreferrer"
              variant="primary"
            >
              Abrir WhatsApp da arena
            </Button>
          )}
        </div>
      )}

      {expandido && !modoPublico && (
        <div className="horario-card-form">
          {mensalistaContratado && (
            <div className="horario-mensalista-notice">
              <div>Mensalista contratado</div>
              <div className="horario-mensalista-name">
                {mensalistaContratado.nome}
              </div>
            </div>
          )}

          {mensalistaContratado ? (
            <>
              {!mostrandoAluguelAvulso ? (
                <Button
                  className="horario-action-button horario-action-full"
                  type="button"
                  onClick={() => setMostrandoAluguelAvulso(true)}
                  variant="primary"
                >
                  Alugar como avulso
                </Button>
              ) : (
                <>
                  <Input
                    className="horario-card-input"
                    placeholder="cliente/Time"
                    value={aluguelAvulso.cliente}
                    onChange={(event) =>
                      atualizarAluguelAvulso("cliente", event.target.value)
                    }
                  />
                  <Input
                    className="horario-card-input"
                    placeholder="Telefone"
                    value={aluguelAvulso.telefone}
                    maxLength={11}
                    onChange={(event) =>
                      atualizarAluguelAvulso("telefone", event.target.value)
                    }
                  />
                  <Input
                    className="horario-card-input"
                    placeholder="Valor"
                    type="number"
                    value={aluguelAvulso.valor}
                    onChange={(event) =>
                      atualizarAluguelAvulso("valor", event.target.value)
                    }
                  />
                  <Select
                    className="horario-card-input"
                    value={aluguelAvulso.status}
                    onChange={(event) =>
                      atualizarAluguelAvulso("status", event.target.value)
                    }
                  >
                    {statusAvulsoLista.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                  <div className="horario-card-actions">
                    <Button
                      className="horario-action-button"
                      type="button"
                      onClick={salvarAluguelAvulso}
                      disabled={salvandoAluguelAvulso}
                      variant="primary"
                    >
                      {salvandoAluguelAvulso ? "Salvando..." : "Salvar avulso"}
                    </Button>
                    <Button
                      className="horario-action-button"
                      type="button"
                      onClick={limparAluguelAvulso}
                      disabled={salvandoAluguelAvulso}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <Input
                className="horario-card-input"
                placeholder="cliente/Time"
                value={item.cliente}
                onChange={onClienteChange}
                disabled={item.status === "Pago"}
              />
              <Input
                className="horario-card-input"
                placeholder="Telefone"
                value={item.telefone}
                maxLength={11}
                onChange={onTelefoneChange}
                disabled={item.status === "Pago"}
              />
              <Input
                className="horario-card-input"
                placeholder="Valor"
                type="number"
                value={item.valor}
                onChange={onValorChange}
                disabled={item.status === "Pago"}
              />
              <Select
                className="horario-card-input"
                value={item.tipo || "Avulso"}
                onChange={onTipoChange}
                disabled={item.status === "Pago"}
              >
                {tipoLista.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </Select>
              <Select
                className="horario-card-input"
                value={item.status}
                onChange={onStatusChange}
                disabled={item.status === "Pago"}
              >
                {statusLista.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>

              <div className="horario-card-actions">
                <Button
                  className="horario-action-button"
                  type="button"
                  onClick={onReservar}
                  variant="primary"
                >
                  {item.status === "Pendente" ? "Confirmar" : "Reservar"}
                </Button>

                {item.telefone && (
                  <Button
                    as="a"
                    className="horario-action-button"
                    href={criarLinkConfirmacaoCliente({
                      nome: item.cliente,
                      telefone: item.telefone,
                      dataFormatada,
                      hora,
                      status: item.status,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    variant="primary"
                  >
                    Enviar confirmacao pelo WhatsApp
                  </Button>
                )}

                <Button
                  className="horario-action-button"
                  type="button"
                  onClick={onLimpar}
                >
                  Limpar
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function criarLinkConfirmacaoCliente({
  nome,
  telefone,
  dataFormatada,
  hora,
  status,
}) {
  const telefoneWhatsApp = formatarTelefoneWhatsApp(telefone);
  const mensagem =
    status === "Reservado"
      ? [
          `Ola, ${nome || "tudo bem"}! Sua reserva foi confirmada.`,
          "",
          `Data: ${dataFormatada || ""}`,
          `Horario: ${hora || ""}`,
          "",
          "Ate la!",
        ].join("\n")
      : [
          `Ola, ${nome || "tudo bem"}! Sua solicitacao de reserva foi recebida.`,
          "",
          `Data: ${dataFormatada || ""}`,
          `Horario: ${hora || ""}`,
          `Status: ${status || "Pendente"}`,
          "",
          "A arena vai confirmar/confirmou seu horario por aqui.",
        ].join("\n");

  return `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(
    mensagem
  )}`;
}

function formatarTelefoneWhatsApp(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");

  if (digitos.startsWith("55")) return digitos;

  return `55${digitos}`;
}
