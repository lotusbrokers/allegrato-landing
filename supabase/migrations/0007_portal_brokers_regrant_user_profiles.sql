-- Portal: devolver ao anon a leitura de user_profiles (lista de corretores).
--
-- SINTOMA (23/09/2026): /lotus-corretores no ar sem nenhum corretor. A leitura
-- da view responde 401:
--
--   GET /rest/v1/portal_brokers?select=id,name  ->  401
--   {"message":"permission denied for view user_profiles"}
--
-- portal_lancamentos e portal_landing_slugs seguem respondendo 200, e
-- tenant_memberships também — só user_profiles nega.
--
-- CAUSA. portal_brokers foi criada com security_invoker = true (migration
-- 0002): ela lê com a permissão de QUEM CHAMA, que aqui é o papel anon. O anon
-- recebeu naquela migration o SELECT das colunas públicas de user_profiles.
-- Recriar um objeto derruba os grants dele — e hoje user_profiles é uma VIEW
-- (a mensagem de erro diz "for view"), o que indica que ela foi recriada
-- depois. Sem o SELECT, a view inteira falha e a lista chega vazia ao portal.
--
-- O portal é somente leitura: não há o que corrigir do lado dele. A correção é
-- devolver o grant aqui, no banco do dashboard.
--
-- Idempotente: pode rodar mais de uma vez.

BEGIN;
SET LOCAL lock_timeout = '5s';

-- Apenas as colunas de exibição, a mesma fronteira da 0002. Email e telefone
-- continuam fora: PII não sai para o anon.
GRANT SELECT (id, full_name, avatar_url) ON public.user_profiles TO anon;

COMMIT;

-- CONFERÊNCIA (as duas devem devolver linhas):
--
--   select id, full_name, avatar_url from public.user_profiles limit 1;
--
--   curl "$SUPABASE_URL/rest/v1/portal_brokers?select=id,name&limit=1" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--
-- SE AINDA NEGAR. Quando user_profiles é uma view com security_invoker = true,
-- o grant nela não basta: o anon também precisa enxergar a tabela base. Nesse
-- caso, o caminho é liberar as colunas públicas na TABELA BASE (nunca as de
-- PII) ou recriar user_profiles sem security_invoker, que é o padrão do
-- Postgres — assim ela lê com a permissão do dono e o grant acima resolve.
