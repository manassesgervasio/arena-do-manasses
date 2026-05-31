import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const ARENA_SLUG_ATUAL = "arena-do-manasses";

export function useArenaAtual(session) {
  const [arenaAtual, setArenaAtual] = useState(null);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [perfilAtual, setPerfilAtual] = useState(null);
  const [carregandoContexto, setCarregandoContexto] = useState(Boolean(session));
  const [erroContexto, setErroContexto] = useState("");

  useEffect(() => {
    let montado = true;

    async function carregarContexto() {
      if (!session?.user?.email) {
        setCarregandoContexto(true);
        setErroContexto("");
        setUsuarioAtual(null);
        setPerfilAtual(null);

        const { data: arenaPublica, error: arenaPublicaError } = await supabase
          .from("arenas")
          .select("id,nome,slug,telefone,ativa")
          .eq("slug", ARENA_SLUG_ATUAL)
          .eq("ativa", true)
          .maybeSingle();

        if (!montado) return;

        if (arenaPublicaError) {
          console.error("Erro ao carregar arena publica:", arenaPublicaError);
          setArenaAtual(null);
          setErroContexto("");
          setCarregandoContexto(false);
          return;
        }

        setArenaAtual(arenaPublica || null);
        setCarregandoContexto(false);
        return;
      }

      setCarregandoContexto(true);
      setErroContexto("");
      setArenaAtual(null);
      setUsuarioAtual(null);
      setPerfilAtual(null);

      const emailAuth = session.user.email.toLowerCase();

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios_sistema")
        .select("id,nome,email,ativo,tipo_usuario")
        .eq("email", emailAuth)
        .eq("ativo", true)
        .maybeSingle();

      if (!montado) return;

      if (usuarioError || !usuario) {
        console.error("Erro ao carregar usuario atual:", usuarioError);
        setErroContexto(
          "Usuario autenticado, mas sem cadastro no sistema. Procure o administrador."
        );
        setArenaAtual(null);
        setUsuarioAtual(null);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      if (usuario.tipo_usuario === "super_admin") {
        const { data: arenaPadrao, error: arenaPadraoError } = await supabase
          .from("arenas")
          .select("id,nome,slug,telefone,ativa")
          .eq("slug", ARENA_SLUG_ATUAL)
          .eq("ativa", true)
          .maybeSingle();

        if (!montado) return;

        if (arenaPadraoError || !arenaPadrao) {
          console.error("Erro ao carregar arena padrao:", arenaPadraoError);
          setErroContexto("Nao foi possivel carregar o contexto da arena.");
          setArenaAtual(null);
          setUsuarioAtual(usuario);
          setPerfilAtual("super_admin");
          setCarregandoContexto(false);
          return;
        }

        setArenaAtual(arenaPadrao);
        setUsuarioAtual(usuario);
        setPerfilAtual("super_admin");
        setCarregandoContexto(false);
        return;
      }

      const { data: vinculos, error: vinculosError } = await supabase
        .from("usuarios_arenas")
        .select("id,usuario_id,arena_id,perfil,ativo,created_at")
        .eq("usuario_id", usuario.id)
        .eq("ativo", true)
        .order("created_at", { ascending: true });

      if (!montado) return;

      if (vinculosError) {
        console.error("Erro ao carregar vinculos usuario-arena:", vinculosError);
        setErroContexto("Nao foi possivel carregar o contexto da arena.");
        setArenaAtual(null);
        setUsuarioAtual(usuario);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      if (!vinculos?.length) {
        setErroContexto("Usuario sem vinculo ativo com arena.");
        setArenaAtual(null);
        setUsuarioAtual(usuario);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      const arenaIds = vinculos.map((vinculo) => vinculo.arena_id);
      const { data: arenas, error: arenasError } = await supabase
        .from("arenas")
        .select("id,nome,slug,telefone,ativa")
        .in("id", arenaIds)
        .eq("ativa", true);

      if (!montado) return;

      if (arenasError || !arenas?.length) {
        console.error("Erro ao carregar arenas vinculadas:", arenasError);
        setErroContexto("Usuario sem vinculo ativo com arena.");
        setArenaAtual(null);
        setUsuarioAtual(usuario);
        setPerfilAtual(null);
        setCarregandoContexto(false);
        return;
      }

      const arenaSelecionada =
        vinculos
          .map((vinculo) => arenas.find((arena) => arena.id === vinculo.arena_id))
          .find(Boolean) || arenas[0];
      const vinculoSelecionado = vinculos.find(
        (vinculo) => vinculo.arena_id === arenaSelecionada.id
      );

      setArenaAtual(arenaSelecionada);
      setUsuarioAtual(usuario);
      setPerfilAtual(vinculoSelecionado?.perfil || null);
      setCarregandoContexto(false);
    }

    carregarContexto();

    return () => {
      montado = false;
    };
  }, [session]);

  return {
    arenaAtual,
    usuarioAtual,
    perfilAtual,
    carregandoContexto,
    erroContexto,
  };
}
