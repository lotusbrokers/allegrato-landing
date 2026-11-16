-- Site do Cliente, Fase 1: a página pessoal do lead, lotusbrokers.com.br/<slug>/<token>.
--
-- PROPOSTA PARA O DEV DA OCTO DASH. NÃO APLICADA. Briefing com o porquê, as
-- opções e as perguntas: docs/para-devs/DEV — Site do Cliente (16-11-2026).md.
--
-- Desenho:
--   - Tudo mora no banco da Dash, ligado ao lead. O portal NÃO ganha chave de
--     serviço: lê e grava só pelas funções abaixo (security definer), que
--     validam o token da página. As tabelas não têm policy para o anon.
--   - Três tokens por página, todos aleatórios de 128 bits:
--       token          do cliente (vê tudo, inclusive a simulação);
--       token_convite  o link que o cliente compartilha com quem decide junto;
--       convidado.token  o de cada convidado, depois que ele diz o nome.
--     O slug ("erick.ferrigatti") é só legível: sozinho não abre nada.
--   - Eventos e avisos são idempotentes por chave única. A REGRA das 3 aberturas
--     no dia roda no portal (TypeScript, com teste); aqui só a garantia de que o
--     aviso do dia entra uma vez.
--
-- >>> CONFIRMAR antes de rodar:
--   1. Nome e colunas da tabela de leads: public.leads(id uuid, tenant_id uuid,
--      nome text, corretor_id uuid). O corretor do lead é o "responsável" da
--      distribuição atual? Ajuste os JOINs marcados com <<<.
--   2. cliente_paginas.corretor_id aponta para tenant_memberships.id (o mesmo id
--      de portal_brokers.id)? Ajuste a FK se for user_profiles.id.
--   3. Papéis que podem ver e editar páginas de outros corretores (ex.:
--      'team_leader', 'admin', 'owner'). Hoje: só o corretor da página e esses.
--   4. Extensão pgcrypto disponível (gen_random_bytes).
--
-- Idempotente: seguro reexecutar. Aplicar em baixo tráfego (locks).

BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Tabelas ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cliente_paginas (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  lead_id            uuid NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,   -- <<< CONFIRMAR (1)
  corretor_id        uuid NOT NULL REFERENCES public.tenant_memberships(id),                -- <<< CONFIRMAR (2)
  slug               text NOT NULL CHECK (slug ~ '^[a-z0-9]+(\.[a-z0-9]+)?(-[0-9]{1,2})?$'),
  token              text NOT NULL UNIQUE,
  token_convite      text NOT NULL UNIQUE,
  modo               text NOT NULL DEFAULT 'selecao' CHECK (modo IN ('selecao', 'proposta', 'acompanhamento')),
  mensagem           text CHECK (char_length(mensagem) <= 600),
  consentimento_em   timestamptz,          -- o cliente aceitou o registro do que ele vê (LGPD)
  remocao_pedida_em  timestamptz,          -- o cliente pediu para remover: a página some na hora
  criada_em          timestamptz NOT NULL DEFAULT now(),
  atualizada_em      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- A seleção do corretor: o que aparece na página, na ordem dele.
CREATE TABLE IF NOT EXISTS public.cliente_pagina_imoveis (
  pagina_id        uuid NOT NULL REFERENCES public.cliente_paginas(id) ON DELETE CASCADE,
  codigo_imovel    text NOT NULL,          -- o mesmo código de portal_imoveis (AP0018)
  ordem            int  NOT NULL DEFAULT 0,
  por_que_combina  text CHECK (char_length(por_que_combina) <= 800),
  -- Simulação ANEXADA pelo corretor (banco/correspondente), nunca calculada pelo
  -- site: {banco, entrada, parcela, prazo_meses, sistema, feita_em}.
  simulacao        jsonb,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pagina_id, codigo_imovel)
);

-- "Minha lista" do cliente, como um carrinho.
CREATE TABLE IF NOT EXISTS public.cliente_pagina_favoritos (
  pagina_id      uuid NOT NULL REFERENCES public.cliente_paginas(id) ON DELETE CASCADE,
  codigo_imovel  text NOT NULL,
  ordem          int  NOT NULL DEFAULT 0,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pagina_id, codigo_imovel)
);

CREATE TABLE IF NOT EXISTS public.cliente_pagina_convidados (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id    uuid NOT NULL REFERENCES public.cliente_paginas(id) ON DELETE CASCADE,
  nome         text NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 60),
  token        text NOT NULL UNIQUE,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  revogado_em  timestamptz
);

-- ❤️ (1) ou 👎 (-1), um por pessoa e imóvel. convidado_id nulo = o próprio cliente.
CREATE TABLE IF NOT EXISTS public.cliente_pagina_votos (
  pagina_id      uuid NOT NULL REFERENCES public.cliente_paginas(id) ON DELETE CASCADE,
  convidado_id   uuid REFERENCES public.cliente_pagina_convidados(id) ON DELETE CASCADE,
  codigo_imovel  text NOT NULL,
  voto           smallint NOT NULL CHECK (voto IN (-1, 1)),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cliente_pagina_votos_um_por_pessoa
  ON public.cliente_pagina_votos (pagina_id, coalesce(convidado_id, '00000000-0000-0000-0000-000000000000'::uuid), codigo_imovel);

-- Linha do tempo do lead. `chave` vem do navegador, uma por evento: reenvio não duplica.
CREATE TABLE IF NOT EXISTS public.cliente_pagina_eventos (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pagina_id      uuid NOT NULL REFERENCES public.cliente_paginas(id) ON DELETE CASCADE,
  convidado_id   uuid REFERENCES public.cliente_pagina_convidados(id) ON DELETE CASCADE,
  tipo           text NOT NULL CHECK (tipo IN ('abriu', 'viu_imovel', 'tempo_imovel', 'favoritou', 'desfavoritou', 'votou', 'comparou', 'compartilhou')),
  codigo_imovel  text,
  duracao_ms     int CHECK (duracao_ms IS NULL OR duracao_ms BETWEEN 0 AND 3600000),
  chave          text NOT NULL CHECK (char_length(chave) BETWEEN 8 AND 64),
  ocorrido_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pagina_id, chave)
);
CREATE INDEX IF NOT EXISTS cliente_pagina_eventos_por_pagina ON public.cliente_pagina_eventos (pagina_id, ocorrido_em DESC);

-- Um aviso por página, tipo e dia (fuso de São Paulo): é o que impede aviso duplicado.
CREATE TABLE IF NOT EXISTS public.cliente_pagina_avisos (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pagina_id      uuid NOT NULL REFERENCES public.cliente_paginas(id) ON DELETE CASCADE,
  tipo           text NOT NULL CHECK (tipo IN ('tres_aberturas', 'remocao_pedida')),
  dia            date NOT NULL,
  codigo_imovel  text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  entregue_em    timestamptz,
  UNIQUE (pagina_id, tipo, dia)
);

-- 2) RLS: o anon não toca nas tabelas; o corretor logado vê e edita as dele --

ALTER TABLE public.cliente_paginas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_pagina_imoveis     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_pagina_favoritos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_pagina_convidados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_pagina_votos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_pagina_eventos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_pagina_avisos      ENABLE ROW LEVEL SECURITY;

-- O usuário logado responde por esta página? Corretor dela ou papel de gestão no tenant.
CREATE OR REPLACE FUNCTION public._cliente_pagina_e_minha(p_pagina uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM cliente_paginas p
      JOIN tenant_memberships m ON m.tenant_id = p.tenant_id AND m.user_id = auth.uid()
     WHERE p.id = p_pagina
       AND (m.id = p.corretor_id OR m.role IN ('team_leader', 'admin', 'owner'))   -- <<< CONFIRMAR (3)
  )
$$;
REVOKE ALL ON FUNCTION public._cliente_pagina_e_minha(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._cliente_pagina_e_minha(uuid) TO authenticated;

DROP POLICY IF EXISTS corretor_le_pagina ON public.cliente_paginas;
CREATE POLICY corretor_le_pagina ON public.cliente_paginas FOR SELECT TO authenticated
  USING (public._cliente_pagina_e_minha(id));
DROP POLICY IF EXISTS corretor_edita_pagina ON public.cliente_paginas;
CREATE POLICY corretor_edita_pagina ON public.cliente_paginas FOR UPDATE TO authenticated
  USING (public._cliente_pagina_e_minha(id)) WITH CHECK (public._cliente_pagina_e_minha(id));

DROP POLICY IF EXISTS corretor_edita_selecao ON public.cliente_pagina_imoveis;
CREATE POLICY corretor_edita_selecao ON public.cliente_pagina_imoveis FOR ALL TO authenticated
  USING (public._cliente_pagina_e_minha(pagina_id)) WITH CHECK (public._cliente_pagina_e_minha(pagina_id));

DROP POLICY IF EXISTS corretor_le_favoritos ON public.cliente_pagina_favoritos;
CREATE POLICY corretor_le_favoritos ON public.cliente_pagina_favoritos FOR SELECT TO authenticated
  USING (public._cliente_pagina_e_minha(pagina_id));
DROP POLICY IF EXISTS corretor_le_convidados ON public.cliente_pagina_convidados;
CREATE POLICY corretor_le_convidados ON public.cliente_pagina_convidados FOR SELECT TO authenticated
  USING (public._cliente_pagina_e_minha(pagina_id));
DROP POLICY IF EXISTS corretor_le_votos ON public.cliente_pagina_votos;
CREATE POLICY corretor_le_votos ON public.cliente_pagina_votos FOR SELECT TO authenticated
  USING (public._cliente_pagina_e_minha(pagina_id));
DROP POLICY IF EXISTS corretor_le_eventos ON public.cliente_pagina_eventos;
CREATE POLICY corretor_le_eventos ON public.cliente_pagina_eventos FOR SELECT TO authenticated
  USING (public._cliente_pagina_e_minha(pagina_id));
DROP POLICY IF EXISTS corretor_le_avisos ON public.cliente_pagina_avisos;
CREATE POLICY corretor_le_avisos ON public.cliente_pagina_avisos FOR SELECT TO authenticated
  USING (public._cliente_pagina_e_minha(pagina_id));

GRANT SELECT, UPDATE (mensagem, modo, atualizada_em) ON public.cliente_paginas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_pagina_imoveis TO authenticated;
GRANT SELECT ON public.cliente_pagina_favoritos, public.cliente_pagina_convidados, public.cliente_pagina_votos,
  public.cliente_pagina_eventos, public.cliente_pagina_avisos TO authenticated;

-- 3) Funções internas ---------------------------------------------------------

-- 128 bits em base64url (22 caracteres).
CREATE OR REPLACE FUNCTION public._cliente_token()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT translate(encode(gen_random_bytes(16), 'base64'), '+/=', '-_')
$$;
REVOKE ALL ON FUNCTION public._cliente_token() FROM PUBLIC, anon, authenticated;

-- De quem é o token: 'cliente', 'convidado' ou 'convite'. Página removida não resolve.
CREATE OR REPLACE FUNCTION public._cliente_resolver(p_token text)
RETURNS TABLE (pagina_id uuid, convidado_id uuid, papel text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT x.pagina_id, x.convidado_id, x.papel FROM (
    SELECT p.id AS pagina_id, NULL::uuid AS convidado_id, 'cliente' AS papel
      FROM cliente_paginas p WHERE p.token = p_token AND p.remocao_pedida_em IS NULL
    UNION ALL
    SELECT p.id, NULL::uuid, 'convite'
      FROM cliente_paginas p WHERE p.token_convite = p_token AND p.remocao_pedida_em IS NULL
    UNION ALL
    SELECT c.pagina_id, c.id, 'convidado'
      FROM cliente_pagina_convidados c JOIN cliente_paginas p ON p.id = c.pagina_id
     WHERE c.token = p_token AND c.revogado_em IS NULL AND p.remocao_pedida_em IS NULL
  ) x
  WHERE char_length(p_token) BETWEEN 20 AND 40
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public._cliente_resolver(text) FROM PUBLIC, anon, authenticated;

-- 4) Funções do portal (anon, validadas pelo token) ---------------------------

-- A página, do jeito que cada papel pode ver. Convidado e convite nunca recebem
-- simulação, consentimento nem o link de convite.
CREATE OR REPLACE FUNCTION public.pagina_do_cliente(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v jsonb;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.pagina_id IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'papel', r.papel,
    'convidado', (SELECT jsonb_build_object('id', c.id, 'nome', c.nome) FROM cliente_pagina_convidados c WHERE c.id = r.convidado_id),
    'slug', p.slug,
    'modo', p.modo,
    'mensagem', p.mensagem,
    'primeiro_nome', split_part(trim(l.nome), ' ', 1),                                   -- <<< CONFIRMAR (1)
    'consentimento_em', CASE WHEN r.papel = 'cliente' THEN p.consentimento_em END,
    'token_convite', CASE WHEN r.papel = 'cliente' THEN p.token_convite END,
    'corretor', (SELECT jsonb_build_object('id', b.id, 'nome', b.name, 'foto', b.photo_url) FROM portal_brokers b WHERE b.id = p.corretor_id),
    'imoveis', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'codigo', i.codigo_imovel, 'ordem', i.ordem, 'por_que_combina', i.por_que_combina,
               'simulacao', CASE WHEN r.papel = 'cliente' THEN i.simulacao END)
             ORDER BY i.ordem, i.codigo_imovel)
        FROM cliente_pagina_imoveis i WHERE i.pagina_id = p.id), '[]'::jsonb),
    'favoritos', COALESCE((
      SELECT jsonb_agg(f.codigo_imovel ORDER BY f.ordem, f.criado_em)
        FROM cliente_pagina_favoritos f WHERE f.pagina_id = p.id), '[]'::jsonb),
    'votos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('codigo', vt.codigo_imovel, 'voto', vt.voto, 'convidado_id', vt.convidado_id,
                                          'quem', COALESCE(c.nome, split_part(trim(l.nome), ' ', 1))))
        FROM cliente_pagina_votos vt LEFT JOIN cliente_pagina_convidados c ON c.id = vt.convidado_id
       WHERE vt.pagina_id = p.id), '[]'::jsonb)
  ) INTO v
  FROM cliente_paginas p JOIN leads l ON l.id = p.lead_id                                 -- <<< CONFIRMAR (1)
  WHERE p.id = r.pagina_id;
  RETURN v;
END $$;

-- Quem abriu o link de convite diz o nome e ganha o próprio token (até 20 por página).
CREATE OR REPLACE FUNCTION public.entrar_como_convidado(p_token_convite text, p_nome text)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_token text;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token_convite);
  IF r.papel IS DISTINCT FROM 'convite' OR char_length(trim(coalesce(p_nome, ''))) NOT BETWEEN 1 AND 60 THEN RETURN NULL; END IF;
  IF (SELECT count(*) FROM cliente_pagina_convidados WHERE pagina_id = r.pagina_id AND revogado_em IS NULL) >= 20 THEN RETURN NULL; END IF;
  v_token := _cliente_token();
  INSERT INTO cliente_pagina_convidados (pagina_id, nome, token) VALUES (r.pagina_id, trim(p_nome), v_token);
  RETURN v_token;
END $$;

-- Registra um evento (idempotente pela chave). Cliente: só com consentimento.
-- Convidado: só ações explícitas (voto). Na abertura do cliente, devolve as
-- aberturas de hoje para o portal aplicar a regra das 3 aberturas.
CREATE OR REPLACE FUNCTION public.registrar_evento(p_token text, p_tipo text, p_codigo text, p_duracao_ms int, p_chave text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_inseridos int;
  v_aberturas jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.pagina_id IS NULL OR r.papel = 'convite' THEN RETURN jsonb_build_object('registrado', false); END IF;
  IF r.papel = 'cliente' AND (SELECT consentimento_em FROM cliente_paginas WHERE id = r.pagina_id) IS NULL THEN
    RETURN jsonb_build_object('registrado', false, 'motivo', 'sem_consentimento');
  END IF;
  IF r.papel = 'convidado' AND p_tipo <> 'votou' THEN RETURN jsonb_build_object('registrado', false); END IF;

  INSERT INTO cliente_pagina_eventos (pagina_id, convidado_id, tipo, codigo_imovel, duracao_ms, chave)
  VALUES (r.pagina_id, r.convidado_id, p_tipo, left(p_codigo, 20), p_duracao_ms, p_chave)
  ON CONFLICT (pagina_id, chave) DO NOTHING;
  GET DIAGNOSTICS v_inseridos = ROW_COUNT;

  IF p_tipo = 'abriu' AND r.papel = 'cliente' THEN
    SELECT COALESCE(jsonb_agg(e.ocorrido_em ORDER BY e.ocorrido_em), '[]'::jsonb) INTO v_aberturas
      FROM cliente_pagina_eventos e
     WHERE e.pagina_id = r.pagina_id AND e.convidado_id IS NULL AND e.tipo = 'abriu'
       AND e.ocorrido_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo';
  END IF;
  RETURN jsonb_build_object('registrado', v_inseridos > 0, 'aberturas_hoje', v_aberturas);
END $$;

-- Grava o aviso do dia, uma vez só. Devolve o que o portal precisa para mandar a
-- mensagem quando a linha é nova; null quando o aviso do dia já existia.
CREATE OR REPLACE FUNCTION public.registrar_aviso(p_token text, p_tipo text, p_codigo text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_id bigint;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.papel IS DISTINCT FROM 'cliente' OR p_tipo NOT IN ('tres_aberturas', 'remocao_pedida') THEN RETURN NULL; END IF;
  INSERT INTO cliente_pagina_avisos (pagina_id, tipo, dia, codigo_imovel)
  VALUES (r.pagina_id, p_tipo, (now() AT TIME ZONE 'America/Sao_Paulo')::date, left(p_codigo, 20))
  ON CONFLICT (pagina_id, tipo, dia) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN NULL; END IF;
  RETURN (
    SELECT jsonb_build_object('aviso_id', v_id, 'lead_id', p.lead_id, 'corretor_id', p.corretor_id,
                              'primeiro_nome', split_part(trim(l.nome), ' ', 1), 'codigo_imovel', left(p_codigo, 20))
      FROM cliente_paginas p JOIN leads l ON l.id = p.lead_id                              -- <<< CONFIRMAR (1)
     WHERE p.id = r.pagina_id
  );
END $$;

-- Ações do cliente (convidado não mexe na lista nem no consentimento).
CREATE OR REPLACE FUNCTION public.favoritar(p_token text, p_codigo text, p_favorito boolean)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.papel IS DISTINCT FROM 'cliente' OR p_codigo IS NULL OR char_length(p_codigo) > 20 THEN RETURN false; END IF;
  IF p_favorito THEN
    INSERT INTO cliente_pagina_favoritos (pagina_id, codigo_imovel, ordem)
    VALUES (r.pagina_id, p_codigo, (SELECT coalesce(max(ordem), 0) + 1 FROM cliente_pagina_favoritos WHERE pagina_id = r.pagina_id))
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM cliente_pagina_favoritos WHERE pagina_id = r.pagina_id AND codigo_imovel = p_codigo;
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.reordenar_favoritos(p_token text, p_codigos text[])
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.papel IS DISTINCT FROM 'cliente' THEN RETURN false; END IF;
  UPDATE cliente_pagina_favoritos f SET ordem = x.posicao
    FROM unnest(p_codigos) WITH ORDINALITY AS x(codigo, posicao)
   WHERE f.pagina_id = r.pagina_id AND f.codigo_imovel = x.codigo;
  RETURN true;
END $$;

-- ❤️/👎 do cliente ou de um convidado; voto 0 apaga.
CREATE OR REPLACE FUNCTION public.votar(p_token text, p_codigo text, p_voto smallint)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.papel NOT IN ('cliente', 'convidado') OR p_voto NOT IN (-1, 0, 1)
     OR NOT EXISTS (SELECT 1 FROM cliente_pagina_imoveis WHERE pagina_id = r.pagina_id AND codigo_imovel = p_codigo) THEN
    RETURN false;
  END IF;
  DELETE FROM cliente_pagina_votos
   WHERE pagina_id = r.pagina_id AND codigo_imovel = p_codigo AND convidado_id IS NOT DISTINCT FROM r.convidado_id;
  IF p_voto <> 0 THEN
    INSERT INTO cliente_pagina_votos (pagina_id, convidado_id, codigo_imovel, voto) VALUES (r.pagina_id, r.convidado_id, p_codigo, p_voto);
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.registrar_consentimento(p_token text, p_aceito boolean)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.papel IS DISTINCT FROM 'cliente' THEN RETURN false; END IF;
  UPDATE cliente_paginas SET consentimento_em = CASE WHEN p_aceito THEN now() END, atualizada_em = now() WHERE id = r.pagina_id;
  RETURN true;
END $$;

-- LGPD: a página some na hora para todos os links; o corretor recebe o aviso
-- (registrar_aviso 'remocao_pedida', chamado pelo portal antes desta).
CREATE OR REPLACE FUNCTION public.pedir_remocao(p_token text)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _cliente_resolver(p_token);
  IF r.papel IS DISTINCT FROM 'cliente' THEN RETURN false; END IF;
  UPDATE cliente_paginas SET remocao_pedida_em = now(), atualizada_em = now() WHERE id = r.pagina_id;
  RETURN true;
END $$;

-- 5) Funções do corretor (logado, pela Área do Corretor do portal) -------------

-- Cria a página do lead, ou devolve a que já existe. O portal manda os slugs
-- candidatos já na ordem ("erick.ferrigatti", "erick.ferrigatti-2", ...): vale
-- o primeiro livre no tenant. Só o corretor do lead ou um papel de gestão.
CREATE OR REPLACE FUNCTION public.gerar_pagina_do_cliente(p_lead_id uuid, p_slugs text[])
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lead record;
  v_membro record;
  v_pagina cliente_paginas%ROWTYPE;
  v_slug text;
BEGIN
  SELECT l.id, l.tenant_id, l.corretor_id INTO v_lead FROM leads l WHERE l.id = p_lead_id;  -- <<< CONFIRMAR (1)
  IF v_lead.id IS NULL THEN RETURN NULL; END IF;
  SELECT m.id, m.role INTO v_membro FROM tenant_memberships m
   WHERE m.tenant_id = v_lead.tenant_id AND m.user_id = auth.uid() LIMIT 1;
  IF v_membro.id IS NULL OR (v_membro.id IS DISTINCT FROM v_lead.corretor_id AND v_membro.role NOT IN ('team_leader', 'admin', 'owner')) THEN
    RETURN NULL;                                                                          -- <<< CONFIRMAR (3)
  END IF;

  SELECT * INTO v_pagina FROM cliente_paginas WHERE lead_id = p_lead_id;
  IF v_pagina.id IS NULL THEN
    FOREACH v_slug IN ARRAY p_slugs LOOP
      BEGIN
        INSERT INTO cliente_paginas (tenant_id, lead_id, corretor_id, slug, token, token_convite)
        VALUES (v_lead.tenant_id, p_lead_id, coalesce(v_lead.corretor_id, v_membro.id), v_slug, _cliente_token(), _cliente_token())
        RETURNING * INTO v_pagina;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        CONTINUE;  -- slug ocupado no tenant: tenta o próximo candidato
      END;
    END LOOP;
    -- Dois cliques ao mesmo tempo: o outro criou a página do lead primeiro.
    IF v_pagina.id IS NULL THEN SELECT * INTO v_pagina FROM cliente_paginas WHERE lead_id = p_lead_id; END IF;
  END IF;
  IF v_pagina.id IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('id', v_pagina.id, 'slug', v_pagina.slug, 'token', v_pagina.token, 'criada_em', v_pagina.criada_em);
END $$;

-- O nome do lead para o portal montar os slugs candidatos (o banco não tem a regra de slug).
CREATE OR REPLACE FUNCTION public.lead_para_pagina(p_lead_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('id', l.id, 'nome', l.nome,
                            'pagina', (SELECT jsonb_build_object('id', p.id, 'slug', p.slug, 'token', p.token) FROM cliente_paginas p WHERE p.lead_id = l.id))
    FROM leads l                                                                          -- <<< CONFIRMAR (1)
    JOIN tenant_memberships m ON m.tenant_id = l.tenant_id AND m.user_id = auth.uid()
   WHERE l.id = p_lead_id
     AND (m.id = l.corretor_id OR m.role IN ('team_leader', 'admin', 'owner'))            -- <<< CONFIRMAR (3)
   LIMIT 1
$$;

-- 6) Permissões das funções ---------------------------------------------------

REVOKE ALL ON FUNCTION public.pagina_do_cliente(text), public.entrar_como_convidado(text, text),
  public.registrar_evento(text, text, text, int, text), public.registrar_aviso(text, text, text),
  public.favoritar(text, text, boolean), public.reordenar_favoritos(text, text[]), public.votar(text, text, smallint),
  public.registrar_consentimento(text, boolean), public.pedir_remocao(text),
  public.gerar_pagina_do_cliente(uuid, text[]), public.lead_para_pagina(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.pagina_do_cliente(text), public.entrar_como_convidado(text, text),
  public.registrar_evento(text, text, text, int, text), public.registrar_aviso(text, text, text),
  public.favoritar(text, text, boolean), public.reordenar_favoritos(text, text[]), public.votar(text, text, smallint),
  public.registrar_consentimento(text, boolean), public.pedir_remocao(text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.gerar_pagina_do_cliente(uuid, text[]), public.lead_para_pagina(uuid) TO authenticated;

COMMIT;
