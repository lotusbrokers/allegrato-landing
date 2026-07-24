-- Portal: view pública de corretores
--   portal_brokers = tenant_memberships (quem é corretor) JOIN user_profiles (nome/foto)
--
-- Fonte da verdade de QUEM é corretor: tenant_memberships (role + tenant_id).
-- Nome/foto vêm de user_profiles, ligados por tenant_memberships.user_id =
-- user_profiles.id (FK confirmada: tenant_memberships_user_id_fkey).
--
-- Segue o padrão das demais views portal_* (security_invoker + policy de linha
-- por tenant + grant só das colunas públicas). Expõe só id/name/photo — NUNCA
-- email/phone (PII).
--
-- >>> CONFIRMAR antes de rodar:
--   1. UUID do tenant Lotus (= NEXT_PUBLIC_TENANT_ID). Já preenchido abaixo.
--   2. Os valores de `role` em tenant_memberships que representam corretor.
--      (No user_profiles vi 'corretor'/'team_leader'; em tenant_memberships pode
--       ser igual ou diferente — ajuste o IN (...) da policy e da view.)
--   3. user_profiles é TABELA ou VIEW? Se for VIEW, o bloco (2b) falha
--      ("cannot ... on view"): nesse caso o email/phone precisa ser trancado na
--      TABELA BASE de user_profiles, não nela. Rode a parte (2b) só se for tabela.
--
-- Aplicar em baixo tráfego (locks). Idempotente — seguro reexecutar.

BEGIN;
SET LOCAL lock_timeout = '5s';

-- tenant Lotus: 65c69875-dc83-4062-90f6-6f6adc30df26

-- 1) tenant_memberships: RLS + policy de linha (quem o anon pode ver) ----------
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_anon_select_memberships ON public.tenant_memberships;
CREATE POLICY portal_anon_select_memberships
  ON public.tenant_memberships
  FOR SELECT
  TO anon
  USING (
    tenant_id = '65c69875-dc83-4062-90f6-6f6adc30df26'::uuid
    AND role IN ('corretor', 'team_leader')   -- <<< CONFIRMAR valores reais
  );

-- Fronteira de coluna em tenant_memberships: o anon só precisa de user_id (join),
-- tenant_id e role (filtro) e creci (exposto no site). creci é COLUNA da tabela
-- (não vem do jsonb permissions). NÃO liberar permissions/leader_user_id/etc.
REVOKE SELECT ON public.tenant_memberships FROM anon;
GRANT SELECT (id, tenant_id, user_id, role, creci) ON public.tenant_memberships TO anon;

-- 2) user_profiles: só as colunas de exibição (nome/foto) para o anon ----------
-- (2b) SÓ se user_profiles for TABELA. Se for VIEW, pule este bloco e tranque a
-- PII na tabela base dela (o embedding da view precisa deixar id/full_name/
-- avatar_url legíveis pelo anon e esconder email/phone).
REVOKE SELECT ON public.user_profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url) ON public.user_profiles TO anon;

-- 3) View pública --------------------------------------------------------------
DROP VIEW IF EXISTS public.portal_brokers;
CREATE VIEW public.portal_brokers
  WITH (security_invoker = true)
AS
  SELECT
    m.user_id                       AS id,
    m.tenant_id                     AS tenant_id,
    p.full_name                     AS name,
    p.avatar_url                    AS photo_url,
    m.creci                         AS creci
  FROM public.tenant_memberships m
  JOIN public.user_profiles p ON p.id = m.user_id
  WHERE m.tenant_id = '65c69875-dc83-4062-90f6-6f6adc30df26'::uuid
    AND m.role IN ('corretor', 'team_leader')   -- <<< mesmos valores da policy
    AND COALESCE(TRIM(p.full_name), '') <> '';  -- sem nome não vira card

GRANT SELECT ON public.portal_brokers TO anon;

COMMIT;
