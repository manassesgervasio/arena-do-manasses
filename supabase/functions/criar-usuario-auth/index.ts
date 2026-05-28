import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function gerarSenhaTemporaria() {
  const letrasMaiusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letrasMinusculas = "abcdefghijkmnopqrstuvwxyz";
  const numeros = "23456789";
  const simbolos = "!@#$%&*";
  const todos = letrasMaiusculas + letrasMinusculas + numeros + simbolos;
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  const senha = [
    letrasMaiusculas[bytes[0] % letrasMaiusculas.length],
    letrasMinusculas[bytes[1] % letrasMinusculas.length],
    numeros[bytes[2] % numeros.length],
    simbolos[bytes[3] % simbolos.length],
    ...Array.from(bytes.slice(4), (byte) => todos[byte % todos.length]),
  ];

  return senha.sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        sucesso: false,
        mensagem: "Metodo nao permitido.",
      },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          sucesso: false,
          mensagem:
            "Variaveis SUPABASE_URL e SERVICE_ROLE_KEY precisam estar configuradas.",
        },
        500
      );
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const nome = String(body.nome || "").trim();
    const senhaRecebida = body.senha_temporaria
      ? String(body.senha_temporaria)
      : "";

    if (!email || !nome) {
      return jsonResponse(
        {
          sucesso: false,
          mensagem: "Email e nome sao obrigatorios.",
        },
        400
      );
    }

    const senhaTemporaria = senhaRecebida || gerarSenhaTemporaria();
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome,
      },
    });

    if (error) {
      const mensagemErro = error.message?.toLowerCase() || "";
      const usuarioJaExiste =
        mensagemErro.includes("already") ||
        mensagemErro.includes("registered") ||
        mensagemErro.includes("exists") ||
        error.status === 422;

      if (usuarioJaExiste) {
        return jsonResponse({
          sucesso: true,
          auth_existia: true,
          email,
          mensagem: "Usuario Auth ja existe.",
        });
      }

      console.error("Erro ao criar usuario Auth:", error);
      return jsonResponse(
        {
          sucesso: false,
          email,
          mensagem: error.message,
        },
        error.status || 500
      );
    }

    return jsonResponse({
      sucesso: true,
      auth_existia: false,
      email: data.user?.email || email,
      senha_temporaria: senhaRecebida ? undefined : senhaTemporaria,
      mensagem: "Usuario Auth criado com sucesso.",
    });
  } catch (error) {
    console.error("Erro inesperado na function criar-usuario-auth:", error);
    return jsonResponse(
      {
        sucesso: false,
        mensagem: "Erro inesperado ao criar usuario Auth.",
      },
      500
    );
  }
});
