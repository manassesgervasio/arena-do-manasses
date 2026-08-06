const ARENACAM_REQUEST_TIMEOUT_MS = 10000;
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

    return normalizarLanceResposta(payload, cameraId, arenaId);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Tempo limite ao conectar com o Raspberry Pi.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Nao foi possivel conectar ao Raspberry Pi. Verifique rede, URL e CORS."
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
  };
}
