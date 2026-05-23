import { useState } from "react";

const mensalistasMock = [
  {
    id: 1,
    nome: "Time Amigos da Arena",
    telefone: "11987654321",
    valorMensal: 480,
    vencimento: 10,
    status: "Ativo",
    situacao: "Pago",
  },
  {
    id: 2,
    nome: "Escolinha Base Forte",
    telefone: "11912345678",
    valorMensal: 720,
    vencimento: 5,
    status: "Ativo",
    situacao: "Pendente",
  },
  {
    id: 3,
    nome: "Grupo Quarta FC",
    telefone: "11955554444",
    valorMensal: 360,
    vencimento: 20,
    status: "Pausado",
    situacao: "Vencido",
  },
];

const statusLista = ["Ativo", "Pausado", "Cancelado"];
const situacaoLista = ["Pago", "Pendente", "Vencido"];

export default function MensalistasSection({ moeda }) {
  const [mensalistas, setMensalistas] = useState(mensalistasMock);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novoMensalista, setNovoMensalista] = useState({
    nome: "",
    telefone: "",
    valorMensal: "",
    vencimento: "",
    status: "Ativo",
    situacao: "Pendente",
  });

  function atualizarCampo(campo, valor) {
    setNovoMensalista((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function adicionarMensalista(event) {
    event.preventDefault();

    setMensalistas((anteriores) => [
      {
        ...novoMensalista,
        id: Date.now(),
        valorMensal: Number(novoMensalista.valorMensal || 0),
        vencimento: Number(novoMensalista.vencimento || 1),
      },
      ...anteriores,
    ]);

    setNovoMensalista({
      nome: "",
      telefone: "",
      valorMensal: "",
      vencimento: "",
      status: "Ativo",
      situacao: "Pendente",
    });
    setMostrarFormulario(false);
  }

  return (
    <section className="mensalistas-section">
      <div className="mensalistas-header">
        <div>
          <h2>Mensalistas</h2>
          <p>Cadastro visual temporario, sem banco e sem agenda</p>
        </div>

        <button
          type="button"
          className="mensalistas-primary-button"
          onClick={() => setMostrarFormulario((valor) => !valor)}
        >
          {mostrarFormulario ? "Fechar" : "Novo mensalista"}
        </button>
      </div>

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
          <select
            value={novoMensalista.situacao}
            onChange={(event) => atualizarCampo("situacao", event.target.value)}
          >
            {situacaoLista.map((situacao) => (
              <option key={situacao}>{situacao}</option>
            ))}
          </select>
          <button type="submit">Adicionar</button>
        </form>
      )}

      <div className="mensalistas-grid">
        {mensalistas.map((mensalista) => (
          <article className="mensalista-card" key={mensalista.id}>
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
              <Info label="Valor mensal" value={moeda(mensalista.valorMensal)} />
              <Info label="Vencimento" value={`Dia ${mensalista.vencimento}`} />
            </div>

            <span
              className={`mensalista-situacao mensalista-situacao-${mensalista.situacao.toLowerCase()}`}
            >
              {mensalista.situacao}
            </span>
          </article>
        ))}
      </div>
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
