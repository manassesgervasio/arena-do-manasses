const MOCK_DELAY_MS = 900;
export const ARENACAM_RETENTION_HOURS = 72;
export const ARENACAM_RETENTION_MS =
  ARENACAM_RETENTION_HOURS * 60 * 60 * 1000;

function esperar(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function criarIdLance(cameraId) {
  return `lance-${cameraId}-${Date.now()}`;
}

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

  await esperar(MOCK_DELAY_MS);

  const createdAt = new Date().toISOString();
  const expiresAt = calcularExpiresAt(createdAt);

  return {
    id: criarIdLance(cameraId),
    camera_id: cameraId,
    arena_id: arenaId,
    created_at: createdAt,
    expires_at: expiresAt,
    status: "concluido",
    video_url: `/mock/arenacam/${arenaId}/${cameraId}/${createdAt}.mp4`,
  };
}
