import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useArenaPublica(slug) {
  const [arenaAtual, setArenaAtual] = useState(null);
  const [carregandoContexto, setCarregandoContexto] = useState(Boolean(slug));
  const [erroContexto, setErroContexto] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarArena() {
      if (!slug) {
        setArenaAtual(null);
        setErroContexto("");
        setCarregandoContexto(false);
        return;
      }

      setCarregandoContexto(true);
      setErroContexto("");

      const { data, error } = await buscarArenaPublicaPorSlug(slug);

      if (!ativo) return;

      if (error || !data) {
        setArenaAtual(null);
        setErroContexto("Arena não encontrada ou indisponível.");
        setCarregandoContexto(false);
        return;
      }

      setArenaAtual(data);
      setCarregandoContexto(false);
    }

    carregarArena();

    return () => {
      ativo = false;
    };
  }, [slug]);

  return {
    arenaAtual,
    usuarioAtual: null,
    perfilAtual: null,
    carregandoContexto,
    erroContexto,
  };
}

async function buscarArenaPublicaPorSlug(slug) {
  const consultaPublica = await supabase
    .from("agenda_publica_arenas")
    .select("id,nome,slug,telefone,cidade,estado")
    .eq("slug", slug)
    .maybeSingle();

  if (!consultaPublica.error) {
    return {
      data: consultaPublica.data
        ? { ...consultaPublica.data, ativa: true }
        : null,
      error: null,
    };
  }

  const consultaPublicaMinima = await supabase
    .from("agenda_publica_arenas")
    .select("id,nome,slug,telefone")
    .eq("slug", slug)
    .maybeSingle();

  if (!consultaPublicaMinima.error) {
    return {
      data: consultaPublicaMinima.data
        ? { ...consultaPublicaMinima.data, ativa: true }
        : null,
      error: null,
    };
  }

  if (!erroRecursoPublicoInexistente(consultaPublica.error)) {
    return { data: null, error: consultaPublica.error };
  }

  console.warn(
    "Fallback temporário: agenda_publica_arenas ainda não existe ou não possui todos os campos públicos.",
    consultaPublica.error
  );

  return supabase
    .from("arenas")
    .select("id,nome,slug,telefone,cidade,estado,ativa")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle();
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
