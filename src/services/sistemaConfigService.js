import { supabase } from "../supabase";

const SISTEMA_CONFIG_ID = 1;
const SISTEMA_CONFIG_SELECT = "id,logo_lances_url,logo_lances_ativa,updated_at";

export async function carregarMarcaLancesConfig() {
  const { data, error } = await supabase
    .from("sistema_config")
    .select(SISTEMA_CONFIG_SELECT)
    .eq("id", SISTEMA_CONFIG_ID)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Nao foi possivel carregar a marca dos lances. ${error.message || ""}`
    );
  }

  return normalizarConfig(data);
}

export async function salvarMarcaLancesConfig({ logoLancesUrl, logoLancesAtiva }) {
  const payload = {
    id: SISTEMA_CONFIG_ID,
    logo_lances_url: String(logoLancesUrl || "").trim() || null,
    logo_lances_ativa: Boolean(logoLancesAtiva),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("sistema_config")
    .upsert(payload, { onConflict: "id" })
    .select(SISTEMA_CONFIG_SELECT)
    .single();

  if (error) {
    throw new Error(
      `Nao foi possivel salvar a marca dos lances. ${error.message || ""}`
    );
  }

  return normalizarConfig(data);
}

function normalizarConfig(config) {
  return {
    id: config?.id || SISTEMA_CONFIG_ID,
    logoLancesUrl: config?.logo_lances_url || "",
    logoLancesAtiva: Boolean(config?.logo_lances_ativa),
    updatedAt: config?.updated_at || "",
  };
}
