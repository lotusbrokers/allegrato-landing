-- Portal: adiciona contagem de imóveis ativos por corretor em portal_brokers
--
-- "Imóvel ativo do site" = imoveis_locais com status_aprovacao='aprovado' — a
-- MESMA definição que a view portal_imoveis usa para listar imóveis no portal.
-- Captador = imoveis_locais.criado_por (= tenant_memberships.user_id = o `id`
-- exposto por portal_brokers). Casa por um id só, sem ambiguidade.
--
-- portal_imoveis NÃO expõe criado_por (é vitrine pública), por isso a contagem
-- sai da tabela base imoveis_locais. Como portal_brokers é security_invoker, a
-- subquery roda como `anon` — por isso liberamos ao anon SÓ as 3 colunas da
-- contagem (tenant_id, criado_por, status_aprovacao), escopadas ao tenant Lotus.
-- Segue o mesmo padrão de 0002_portal_brokers_view.sql. Idempotente.
--
-- Aplicar em baixo tráfego (locks).

BEGIN;
SET LOCAL lock_timeout = '5s';

-- tenant Lotus: 65c69875-dc83-4062-90f6-6f6adc30df26

-- 1) imoveis_locais: RLS + policy de linha (o que o anon pode contar) ----------
ALTER TABLE public.imoveis_locais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_anon_count_imoveis ON public.imoveis_locais;
CREATE POLICY portal_anon_count_imoveis
  ON public.imoveis_locais
  FOR SELECT
  TO anon
  USING (
    tenant_id = '65c69875-dc83-4062-90f6-6f6adc30df26'::uuid
    AND status_aprovacao = 'aprovado'
  );

-- Fronteira de coluna: o anon só enxerga o necessário para contar por corretor.
-- NUNCA liberar proprietário, valores, endereço, fotos, etc.
REVOKE SELECT ON public.imoveis_locais FROM anon;
GRANT SELECT (tenant_id, criado_por, status_aprovacao) ON public.imoveis_locais TO anon;

-- 2) View pública: recria com a coluna imoveis_ativos ---------------------------
DROP VIEW IF EXISTS public.portal_brokers;
CREATE VIEW public.portal_brokers
  WITH (security_invoker = true)
AS
  SELECT
    m.user_id                       AS id,
    m.tenant_id                     AS tenant_id,
    p.full_name                     AS name,
    p.avatar_url                    AS photo_url,
    m.creci                         AS creci,
    COALESCE((
      SELECT count(*)
      FROM public.imoveis_locais il
      WHERE il.tenant_id = m.tenant_id
        AND il.criado_por = m.user_id
        AND il.status_aprovacao = 'aprovado'
    ), 0)                           AS imoveis_ativos
  FROM public.tenant_memberships m
  JOIN public.user_profiles p ON p.id = m.user_id
  WHERE m.tenant_id = '65c69875-dc83-4062-90f6-6f6adc30df26'::uuid
    AND m.role IN ('corretor', 'team_leader')
    AND COALESCE(TRIM(p.full_name), '') <> '';

GRANT SELECT ON public.portal_brokers TO anon;

COMMIT;
