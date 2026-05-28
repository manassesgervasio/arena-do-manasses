# Edge Function: criar-usuario-auth

Esta function cria usuarios no Supabase Auth usando a Admin API.

Ela precisa da variavel secreta abaixo configurada no ambiente das Edge Functions:

```bash
npx supabase secrets set SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
```

O valor deve ser a `service_role key` do projeto Supabase. Nao coloque essa chave no front-end.

Depois de configurar o secret, faca o deploy:

```bash
supabase functions deploy criar-usuario-auth
```

Payload esperado:

```json
{
  "email": "usuario@email.com",
  "nome": "Nome do Usuario",
  "senha_temporaria": "Opcional123!"
}
```

Se `senha_temporaria` nao for enviada, a function gera uma senha forte e retorna essa senha apenas na resposta desta criacao.
