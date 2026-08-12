import { supabase } from "../supabase";

export const ARENACAM_LOGOS_BUCKET = "arenacam-logos";
export const ARENACAM_LOGO_TIPOS = {
  ARENA: "arena",
  PATROCINADOR: "patrocinador",
};
export const ARENACAM_LOGO_POSICOES = [
  { value: "top-left", label: "Superior esquerdo" },
  { value: "top-right", label: "Superior direito" },
  { value: "bottom-left", label: "Inferior esquerdo" },
  { value: "bottom-right", label: "Inferior direito" },
  { value: "center-bottom", label: "Centro inferior" },
];

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const URL_ASSINADA_SEGUNDOS = 60 * 60;

export function validarArquivoLogo(arquivo, arenaId) {
  if (!arenaId) {
    throw new Error("Arena atual inválida.");
  }

  if (!arquivo) {
    throw new Error("Selecione uma imagem para enviar.");
  }

  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error("Envie uma imagem PNG, JPEG ou WebP.");
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
}

export async function listarLogosArena(arenaId) {
  if (!arenaId) return [];

  const { data, error } = await supabase
    .from("arenacam_logos")
    .select("id,arena_id,tipo,nome,storage_path,ativo,posicao,ordem,created_at,updated_at")
    .eq("arena_id", arenaId)
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Não foi possível carregar as logos do ArenaCam. ${error.message || ""}`
    );
  }

  return Promise.all((data || []).map(anexarUrlPreview));
}

export async function listarBrandingAtivoArena(arenaId) {
  if (!arenaId) return [];

  const { data, error } = await supabase
    .from("arenacam_logos")
    .select("id,arena_id,tipo,nome,storage_path,ativo,posicao,ordem,created_at")
    .eq("arena_id", arenaId)
    .eq("ativo", true)
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Não foi possível carregar o branding do ArenaCam. ${error.message || ""}`
    );
  }

  const branding = await Promise.all(
    (data || []).map(async (logo) => {
      if (!logo.storage_path?.startsWith(`${arenaId}/`)) return null;

      const { data: signedData, error: signedError } = await supabase.storage
        .from(ARENACAM_LOGOS_BUCKET)
        .createSignedUrl(logo.storage_path, URL_ASSINADA_SEGUNDOS);

      if (signedError || !signedData?.signedUrl) {
        console.warn("ArenaCam branding: URL assinada indisponível.", signedError);
        return null;
      }

      return {
        id: logo.id,
        tipo: logo.tipo,
        nome: logo.nome,
        posicao: logo.posicao,
        image_url: signedData.signedUrl,
      };
    })
  );

  return branding.filter(Boolean);
}

export async function criarLogoArena({ arenaId, tipo, nome, posicao, arquivo, ordem = 0 }) {
  validarTipoLogo(tipo);
  validarPosicaoLogo(posicao);
  validarArquivoLogo(arquivo, arenaId);

  const storagePath = await enviarArquivoLogo({ arenaId, tipo, arquivo });

  try {
    const { data, error } = await supabase
      .from("arenacam_logos")
      .insert({
        arena_id: arenaId,
        tipo,
        nome: normalizarNome(nome, tipo),
        storage_path: storagePath,
        posicao,
        ordem,
      })
      .select("id,arena_id,tipo,nome,storage_path,ativo,posicao,ordem,created_at,updated_at")
      .single();

    if (error) throw error;

    return anexarUrlPreview(data);
  } catch (error) {
    await removerArquivoLogo(storagePath, arenaId);
    throw new Error(
      `Arquivo enviado, mas não foi possível salvar o cadastro da logo. ${
        error.message || ""
      }`
    );
  }
}

export async function atualizarLogoArena({ arenaId, logo, campos = {}, arquivo = null }) {
  validarLogoDaArenaAtual(logo, arenaId);

  const payload = {
    ...campos,
    updated_at: new Date().toISOString(),
  };
  let novoStoragePath = "";

  if (payload.tipo) validarTipoLogo(payload.tipo);
  if (payload.posicao) validarPosicaoLogo(payload.posicao);

  if (arquivo) {
    validarArquivoLogo(arquivo, arenaId);
    novoStoragePath = await enviarArquivoLogo({
      arenaId,
      tipo: logo.tipo,
      arquivo,
    });
    payload.storage_path = novoStoragePath;
  }

  try {
    const { data, error } = await supabase
      .from("arenacam_logos")
      .update(payload)
      .eq("id", logo.id)
      .eq("arena_id", arenaId)
      .select("id,arena_id,tipo,nome,storage_path,ativo,posicao,ordem,created_at,updated_at")
      .single();

    if (error) throw error;

    if (novoStoragePath && logo.storage_path) {
      removerArquivoLogo(logo.storage_path, arenaId).catch((error) => {
        console.warn("Nao foi possivel remover o arquivo anterior da logo:", error);
      });
    }

    return anexarUrlPreview(data);
  } catch (error) {
    if (novoStoragePath) await removerArquivoLogo(novoStoragePath, arenaId);

    throw new Error(
      `Não foi possível atualizar a logo. ${error.message || ""}`
    );
  }
}

export async function excluirLogoArena(logo, arenaId) {
  validarLogoDaArenaAtual(logo, arenaId);

  // Storage e tabela nao compartilham transacao: removemos o arquivo primeiro
  // para evitar registro apagado com arquivo ainda acessivel no bucket.
  await removerArquivoLogo(logo.storage_path, arenaId);

  const { error } = await supabase
    .from("arenacam_logos")
    .delete()
    .eq("id", logo.id)
    .eq("arena_id", arenaId);

  if (error) {
    throw new Error(
      `Arquivo removido, mas não foi possível excluir o registro da logo. ${
        error.message || ""
      }`
    );
  }
}

async function enviarArquivoLogo({ arenaId, tipo, arquivo }) {
  const storagePath = criarStoragePath(arenaId, tipo, arquivo);
  const { error } = await supabase.storage
    .from(ARENACAM_LOGOS_BUCKET)
    .upload(storagePath, arquivo, {
      cacheControl: "31536000",
      contentType: arquivo.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Não foi possível enviar a logo. ${error.message || ""}`);
  }

  return storagePath;
}

async function removerArquivoLogo(storagePath, arenaId) {
  validarStoragePathDaArena(storagePath, arenaId);

  const { error } = await supabase.storage
    .from(ARENACAM_LOGOS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Não foi possível remover o arquivo da logo. ${error.message || ""}`);
  }
}

async function anexarUrlPreview(logo) {
  if (!logo?.storage_path) return { ...logo, preview_url: "" };

  const { data, error } = await supabase.storage
    .from(ARENACAM_LOGOS_BUCKET)
    .createSignedUrl(logo.storage_path, URL_ASSINADA_SEGUNDOS);

  return {
    ...logo,
    preview_url: error ? "" : data?.signedUrl || "",
  };
}

function criarStoragePath(arenaId, tipo, arquivo) {
  const pastaTipo = tipo === ARENACAM_LOGO_TIPOS.ARENA ? "arena" : "patrocinadores";
  const extensao = obterExtensao(arquivo);
  const idUnico =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${arenaId}/${pastaTipo}/${idUnico}.${extensao}`;
}

function obterExtensao(arquivo) {
  if (arquivo.type === "image/png") return "png";
  if (arquivo.type === "image/jpeg") return "jpg";
  if (arquivo.type === "image/webp") return "webp";

  return "img";
}

function normalizarNome(nome, tipo) {
  const nomeLimpo = String(nome || "").trim();

  if (nomeLimpo) return nomeLimpo;
  if (tipo === ARENACAM_LOGO_TIPOS.ARENA) return "Logo da arena";

  return "Patrocinador";
}

function validarTipoLogo(tipo) {
  if (!Object.values(ARENACAM_LOGO_TIPOS).includes(tipo)) {
    throw new Error("Tipo de logo inválido.");
  }
}

function validarPosicaoLogo(posicao) {
  if (!ARENACAM_LOGO_POSICOES.some((item) => item.value === posicao)) {
    throw new Error("Posição de logo inválida.");
  }
}

function validarLogoDaArenaAtual(logo, arenaId) {
  if (!arenaId) throw new Error("Arena atual inválida.");
  if (!logo?.id) throw new Error("Logo inválida.");
  if (logo.arena_id !== arenaId) {
    throw new Error("Esta logo não pertence à arena atual.");
  }

  validarStoragePathDaArena(logo.storage_path, arenaId);
}

function validarStoragePathDaArena(storagePath, arenaId) {
  if (!storagePath || !storagePath.startsWith(`${arenaId}/`)) {
    throw new Error("Arquivo fora do escopo da arena atual.");
  }
}
