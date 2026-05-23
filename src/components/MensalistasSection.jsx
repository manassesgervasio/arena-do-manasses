import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const statusLista = ["Ativo", "Pausado", "Cancelado"];

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
  const [mensalistas, setMensalistas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
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

      setMensalistas((data || []).map(normalizarMensalista));
      setCarregando(false);
    }

    carregarMensalistas();

    return () => {
      ativo = false;
    };
  }, []);

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

  return (
    <section className="mensalistas-section">
      <div className="mensalistas-header">
        <div>
          <h2>Mensalistas</h2>
          <p>Cadastro conectado ao Supabase, sem agenda e sem pagamentos</p>
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
