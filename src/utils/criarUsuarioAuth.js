import { supabase } from "../supabase";

export async function criarUsuarioAuth({ email, nome, senhaTemporaria }) {
  const { data, error } = await supabase.functions.invoke("criar-usuario-auth", {
    body: {
      email,
      nome,
      senha_temporaria: senhaTemporaria || undefined,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.sucesso) {
    throw new Error(data?.mensagem || "Nao foi possivel criar o login Auth.");
  }

  return data;
}
