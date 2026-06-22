import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { Button, Card, EmptyState, Input, Select } from "../components/ui";

export default function BuscaArenasPublica({ onEntrar }) {
  const [arenas, setArenas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({
    nome: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    document.title = "Encontre arenas | ArenaBase";

    let ativo = true;

    async function carregarArenas() {
      setCarregando(true);
      setErro("");

      const { data, error } = await buscarArenasPublicas();

      if (!ativo) return;

      if (error) {
        setArenas([]);
        setErro("Não foi possível carregar as arenas agora.");
        setCarregando(false);
        return;
      }

      setArenas(data || []);
      setCarregando(false);
    }

    carregarArenas();

    return () => {
      ativo = false;
    };
  }, []);

  const estados = useMemo(
    () =>
      [...new Set(arenas.map((arena) => arena.estado).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [arenas]
  );
  const cidades = useMemo(
    () =>
      [
        ...new Set(
          arenas
            .filter((arena) => !filtros.estado || arena.estado === filtros.estado)
            .map((arena) => arena.cidade)
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [arenas, filtros.estado]
  );
  const arenasFiltradas = useMemo(() => {
    const nome = normalizar(filtros.nome);

    return arenas.filter((arena) => {
      const nomeOk = !nome || normalizar(arena.nome).includes(nome);
      const cidadeOk = !filtros.cidade || arena.cidade === filtros.cidade;
      const estadoOk = !filtros.estado || arena.estado === filtros.estado;

      return nomeOk && cidadeOk && estadoOk;
    });
  }, [arenas, filtros]);

  function atualizarFiltro(campo, valor) {
    setFiltros((anteriores) => ({
      ...anteriores,
      [campo]: valor,
      ...(campo === "estado" ? { cidade: "" } : {}),
    }));
  }

  function abrirArena(slug) {
    window.history.pushState({}, "", `/${slug}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="public-search-page">
      <header className="public-search-header">
        <div>
          <strong>ArenaBase</strong>
          <h1>Encontre horários disponíveis</h1>
          <p>Busque arenas por cidade, estado ou nome e veja a agenda pública.</p>
        </div>
        <Button type="button" onClick={onEntrar}>
          Entrar
        </Button>
      </header>

      <Card className="public-search-filters">
        <label>
          <span>Nome da arena</span>
          <Input
            value={filtros.nome}
            onChange={(event) => atualizarFiltro("nome", event.target.value)}
            placeholder="Buscar por nome"
          />
        </label>

        <label>
          <span>Estado</span>
          <Select
            value={filtros.estado}
            onChange={(event) => atualizarFiltro("estado", event.target.value)}
          >
            <option value="">Todos</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </Select>
        </label>

        <label>
          <span>Cidade</span>
          <Select
            value={filtros.cidade}
            onChange={(event) => atualizarFiltro("cidade", event.target.value)}
          >
            <option value="">Todas</option>
            {cidades.map((cidade) => (
              <option key={cidade} value={cidade}>
                {cidade}
              </option>
            ))}
          </Select>
        </label>
      </Card>

      {erro && <div className="public-search-error">{erro}</div>}

      {carregando ? (
        <EmptyState>Carregando arenas...</EmptyState>
      ) : (
        <section className="public-arena-grid">
          {arenasFiltradas.length === 0 && (
            <EmptyState>Nenhuma arena encontrada.</EmptyState>
          )}

          {arenasFiltradas.map((arena) => (
            <Card className="public-arena-card" key={arena.id}>
              <div>
                <h2>{arena.nome}</h2>
                <p>{[arena.cidade, arena.estado].filter(Boolean).join(" / ") || "Local não informado"}</p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => abrirArena(arena.slug)}
              >
                Ver horários
              </Button>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}

async function buscarArenasPublicas() {
  const consultaPublica = await supabase
    .from("agenda_publica_arenas")
    .select("id,nome,slug,cidade,estado")
    .order("nome", { ascending: true });

  if (!consultaPublica.error) {
    return { data: consultaPublica.data || [], error: null };
  }

  if (!erroRecursoPublicoInexistente(consultaPublica.error)) {
    return { data: null, error: consultaPublica.error };
  }

  console.warn(
    "Fallback temporário: agenda_publica_arenas ainda não existe ou não possui cidade/estado.",
    consultaPublica.error
  );

  return supabase
    .from("arenas")
    .select("id,nome,slug,cidade,estado,ativa")
    .eq("ativa", true)
    .order("nome", { ascending: true });
}

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function erroRecursoPublicoInexistente(error) {
  const mensagem = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  return (
    mensagem.includes("agenda_publica_arenas") ||
    mensagem.includes("does not exist") ||
    mensagem.includes("could not find") ||
    mensagem.includes("pgrst202") ||
    mensagem.includes("42p01") ||
    mensagem.includes("42703")
  );
}
