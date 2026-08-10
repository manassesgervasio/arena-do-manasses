import { supabase } from "../supabase";

const ARENACAM_REQUEST_TIMEOUT_MS = 10000;
const ARENACAM_LANCE_SELECT =
  "id,arena_id,camera_id,created_at,expires_at,status,video_url,thumbnail_url";
const ARENACAM_LANCE_SELECT_LEGADO =
  "id,arena_id,camera_id,created_at,expires_at,status,video_url";
export const ARENACAM_RETENTION_HOURS = 72;
export const ARENACAM_RETENTION_MS =
  ARENACAM_RETENTION_HOURS * 60 * 60 * 1000;

export function calcularExpiresAt(createdAt) {
  const dataCriacao = createdAt ? new Date(createdAt) : new Date();

  if (Number.isNaN(dataCriacao.getTime())) {
    return new Date(Date.now() + ARENACAM_RETENTION_MS).toISOString();
  }

  return new Date(dataCriacao.getTime() + ARENACAM_RETENTION_MS).toISOString();
}

export function lanceEstaDisponivel(lance, agora = new Date()) {
  if (!lance || lance.status === "expirado") return false;

  const expiresAt = lance.expires_at ? new Date(lance.expires_at) : null;

  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;

  return expiresAt.getTime() > agora.getTime();
}

export function filtrarLancesDisponiveis(lances = [], agora = new Date()) {
  return lances.filter((lance) => lanceEstaDisponivel(lance, agora));
}

export async function limparLancesExpirados() {
  return {
    executado: false,
    removidos: 0,
    mensagem:
      "Limpeza real pendente: implementar exclusao no storage/API quando a integracao estiver ativa.",
  };
}

export async function salvarLance(lance) {
  const lanceParaBanco = normalizarLanceParaBanco(lance);
  const { data: userData } = await supabase.auth.getUser();
  const createdBy = userData?.user?.id || null;

  let { data, error } = await supabase
    .from("arenacam_lances")
    .insert({
      ...lanceParaBanco,
      created_by: createdBy,
    })
    .select(`${ARENACAM_LANCE_SELECT},created_by`)
    .single();

  if (colunaThumbnailAusente(error)) {
    const lanceLegado = removerThumbnailUrl(lanceParaBanco);
    const resultadoLegado = await supabase
      .from("arenacam_lances")
      .insert({
        ...lanceLegado,
        created_by: createdBy,
      })
      .select(`${ARENACAM_LANCE_SELECT_LEGADO},created_by`)
      .single();

    data = resultadoLegado.data;
    error = resultadoLegado.error;
  }

  if (error) {
    throw new Error(
      `Replay gerado, mas nao foi possivel salvar no Supabase: ${
        error.message || "erro desconhecido"
      }`
    );
  }

  return normalizarLanceDoBanco(data);
}

export async function listarLancesDisponiveis(arenaId) {
  if (!arenaId) return [];

  const agora = new Date().toISOString();
  let { data, error } = await supabase
    .from("arenacam_lances")
    .select(ARENACAM_LANCE_SELECT)
    .eq("arena_id", arenaId)
    .gt("expires_at", agora)
    .order("created_at", { ascending: false });

  if (colunaThumbnailAusente(error)) {
    const resultadoLegado = await supabase
      .from("arenacam_lances")
      .select(ARENACAM_LANCE_SELECT_LEGADO)
      .eq("arena_id", arenaId)
      .gt("expires_at", agora)
      .order("created_at", { ascending: false });

    data = resultadoLegado.data;
    error = resultadoLegado.error;
  }

  if (error) {
    throw new Error(
      `Nao foi possivel carregar os lances do ArenaCam: ${
        error.message || "erro desconhecido"
      }`
    );
  }

  return (data || []).map(normalizarLanceDoBanco);
}

export async function listarReplaysPublicosDisponiveis(arenaSlug) {
  if (!arenaSlug) return [];

  const { data, error } = await supabase.rpc("arenacam_replays_publicos", {
    p_arena_slug: arenaSlug,
  });

  if (error) {
    throw new Error(
      `Nao foi possivel carregar os replays publicos: ${
        error.message || "erro desconhecido"
      }`
    );
  }

  return (data || []).map(normalizarLanceDoBanco);
}

export async function excluirLance(lanceId, arenaId) {
  if (!lanceId) {
    throw new Error("Lance nao informado.");
  }

  if (!arenaId) {
    throw new Error("Arena nao carregada.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error("Sessao autenticada nao encontrada.");
  }

  const apiUrl = obterArenaCamApiUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, ARENACAM_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${apiUrl}/api/lances/${encodeURIComponent(lanceId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          arena_id: arenaId,
        }),
        signal: controller.signal,
      }
    );

    const payload = await lerRespostaJson(response);

    if (!response.ok) {
      throw new Error(
        payload?.message ||
          payload?.error ||
          `Raspberry respondeu com HTTP ${response.status}.`
      );
    }

    return payload || { id: lanceId };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Tempo limite ao conectar com o Raspberry Pi.", {
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Nao foi possivel conectar ao Raspberry Pi. Verifique rede, URL e CORS.",
        { cause: error }
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function gerarLance(cameraId, arenaId) {
  if (!cameraId) {
    throw new Error("Camera nao informada.");
  }

  if (!arenaId) {
    throw new Error("Arena nao carregada.");
  }

  const apiUrl = obterArenaCamApiUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, ARENACAM_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiUrl}/api/lances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        camera_id: cameraId,
        arena_id: arenaId,
      }),
      signal: controller.signal,
    });

    const payload = await lerRespostaJson(response);

    if (!response.ok) {
      throw new Error(
        payload?.message ||
          payload?.error ||
          `Raspberry respondeu com HTTP ${response.status}.`
      );
    }

    const lance = normalizarLanceResposta(payload, cameraId, arenaId);

    return salvarLance(lance);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Tempo limite ao conectar com o Raspberry Pi.", {
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Nao foi possivel conectar ao Raspberry Pi. Verifique rede, URL e CORS.",
        { cause: error }
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function obterArenaCamApiUrl() {
  const apiUrl = import.meta.env.VITE_ARENACAM_API_URL?.trim();

  if (!apiUrl) {
    throw new Error(
      "API do ArenaCam nao configurada. Defina VITE_ARENACAM_API_URL."
    );
  }

  return apiUrl.replace(/\/+$/, "");
}

async function lerRespostaJson(response) {
  const texto = await response.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("Resposta invalida do Raspberry Pi.");
  }
}

function normalizarLanceResposta(payload, cameraId, arenaId) {
  const lance = payload?.lance || payload;

  if (!lance || typeof lance !== "object" || Array.isArray(lance)) {
    throw new Error("Resposta invalida do Raspberry Pi.");
  }

  if (!lance.id) {
    throw new Error("Resposta invalida do Raspberry Pi: id do lance ausente.");
  }

  const createdAt = lance.created_at || new Date().toISOString();
  const expiresAt = lance.expires_at || calcularExpiresAt(createdAt);

  return {
    id: lance.id,
    camera_id: lance.camera_id || cameraId,
    arena_id: lance.arena_id || arenaId,
    created_at: createdAt,
    expires_at: expiresAt,
    status: lance.status || "concluido",
    video_url: lance.video_url || "",
    thumbnail_url: lance.thumbnail_url || "",
  };
}

function normalizarLanceParaBanco(lance) {
  if (!lance || typeof lance !== "object" || Array.isArray(lance)) {
    throw new Error("Lance invalido para salvar no Supabase.");
  }

  const camposObrigatorios = [
    "id",
    "arena_id",
    "camera_id",
    "created_at",
    "expires_at",
    "status",
  ];
  const campoAusente = camposObrigatorios.find((campo) => !lance[campo]);

  if (campoAusente) {
    throw new Error(`Lance invalido: campo ${campoAusente} ausente.`);
  }

  return {
    id: lance.id,
    arena_id: lance.arena_id,
    camera_id: lance.camera_id,
    created_at: lance.created_at,
    expires_at: lance.expires_at,
    status: lance.status,
    video_url: lance.video_url || "",
    thumbnail_url: lance.thumbnail_url || "",
  };
}

function normalizarLanceDoBanco(lance) {
  return {
    id: lance.id,
    arena_id: lance.arena_id,
    camera_id: lance.camera_id,
    created_at: lance.created_at,
    expires_at: lance.expires_at,
    status: lance.status,
    video_url: lance.video_url || "",
    thumbnail_url: lance.thumbnail_url || "",
  };
}

function colunaThumbnailAusente(error) {
  if (!error) return false;

  const mensagem = `${error.message || ""} ${error.details || ""}`;

  return mensagem.includes("thumbnail_url");
}

function removerThumbnailUrl(lance) {
  const lanceLegado = { ...lance };
  delete lanceLegado.thumbnail_url;

  return lanceLegado;
}
