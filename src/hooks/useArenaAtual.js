import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const ARENA_SLUG_ATUAL = "arena-do-manasses";
const USUARIO_EMAIL_TEMPORARIO = "manassesgervasio@hotmail.com";

export function useArenaAtual(ativo = true) {
  const [arenaAtual, setArenaAtual] = useState(null);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [perfilAtual, setPerfilAtual] = useState(null);
  const [carregandoContexto, setCarregandoContexto] = useState(Boolean(ativo));
  const [erroContexto, setErroContexto] = useState("");

  useEffect(() => {
    let montado = true;

    async function carregarContexto() {
      if (!ativo) {
        setArenaAtual(null);
        setUsuarioAtual(null);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        setErroContexto("");
        return;
      }

      setCarregandoContexto(true);
      setErroContexto("");

      const { data: arena, error: arenaError } = await supabase
        .from("arenas")
        .select("id,nome,slug,ativa")
        .eq("slug", ARENA_SLUG_ATUAL)
        .eq("ativa", true)
        .maybeSingle();

      if (!montado) return;

      if (arenaError || !arena) {
        console.error("Erro ao carregar arena atual:", arenaError);
        setErroContexto("Nao foi possivel carregar o contexto da arena.");
        setArenaAtual(null);
        setUsuarioAtual(null);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios_sistema")
        .select("id,nome,email,ativo,tipo_usuario")
        .eq("email", USUARIO_EMAIL_TEMPORARIO)
        .eq("ativo", true)
        .maybeSingle();

      if (!montado) return;

      if (usuarioError || !usuario) {
        console.error("Erro ao carregar usuario atual:", usuarioError);
        setErroContexto("Nao foi possivel carregar o contexto da arena.");
        setArenaAtual(arena);
        setUsuarioAtual(null);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      const { data: vinculo, error: vinculoError } = await supabase
        .from("usuarios_arenas")
        .select("id,usuario_id,arena_id,perfil,ativo")
        .eq("usuario_id", usuario.id)
        .eq("arena_id", arena.id)
        .eq("ativo", true)
        .maybeSingle();

      if (!montado) return;

      if (vinculoError || !vinculo) {
        console.error("Erro ao carregar vinculo usuario-arena:", vinculoError);
        setErroContexto("Nao foi possivel carregar o contexto da arena.");
        setArenaAtual(arena);
        setUsuarioAtual(usuario);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      setArenaAtual(arena);
      setUsuarioAtual(usuario);
      setPerfilAtual(vinculo.perfil);
      setCarregandoContexto(false);
    }

    carregarContexto();

    return () => {
      montado = false;
    };
  }, [ativo]);

  return {
    arenaAtual,
    usuarioAtual,
    perfilAtual,
    carregandoContexto,
    erroContexto,
  };
}
