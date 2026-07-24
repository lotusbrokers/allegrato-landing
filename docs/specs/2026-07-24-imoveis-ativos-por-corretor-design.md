# Imóveis ativos por corretor no portal

**Data:** 2026-07-24
**Repo:** `allegrato-landing` (portal público Lotus). Nenhuma mudança no backend/octo-dash2.

## Problema

O card de corretor do portal (`/lotus-corretores`) mostra `"0 imóveis ativos"`
fixo para todos. O `0` vem do campo `active` em `LotusCorretores.tsx`, que cai
no valor default porque a fonte de dados (view `portal_brokers`) não expõe
contagem de imóveis. Ver `components/LotusCorretores.tsx:456`
(`{b.creci} · {b.active} imóveis ativos`) e `realToBroker` (`:218`), que não
recebe `active` do banco.

## Decisões de fonte (confirmadas por inspeção do banco Lotus)

Tenant Lotus: `65c69875-dc83-4062-90f6-6f6adc30df26`.

- **"Imóvel ativo do site" = `imoveis_locais` com `status_aprovacao = 'aprovado'`.**
  Essa é a mesma definição que o portal já usa para listar imóveis: a view
  pública `portal_imoveis` é literalmente
  `SELECT ... FROM imoveis_locais WHERE status_aprovacao = 'aprovado'`
  (confirmado via `pg_get_viewdef`). Contar a partir daí faz o número do card
  bater com os imóveis realmente visíveis no site — uma única definição de
  "ativo".
- **Captador = `imoveis_locais.criado_por`** (o corretor que cadastrou o
  imóvel no sistema). `portal_imoveis` **não** expõe `criado_por` (é vitrine
  pública), então a contagem sai da tabela base `imoveis_locais`, não da view.
- **Casamento por um id só:** `imoveis_locais.criado_por` = `tenant_memberships.user_id`
  = `portal_brokers.id` = `auth_user_id`. Sem a ambiguidade de dois ids que
  afeta `imoveis_corretores` (que, aliás, está praticamente vazia para Lotus —
  1 linha de teste — e por isso foi descartada como fonte).

### Estado atual dos dados (o que o card mostrará no deploy)

De 5 imóveis em `imoveis_locais` do tenant, apenas **1 está aprovado** (da
corretora Gabriele Fávaro). Portanto, no ar hoje: **Gabriele = 1, os demais 8
corretores = 0.** Não é bug — é o estado real; a métrica cresce sozinha
conforme a Lotus aprova mais imóveis. Decisão do usuário: construir agora
(troca o "0 fixo e falso" por um número real que se corrige com o uso).

## Solução (3 mudanças, todas em `allegrato-landing`)

### 1. Migration `supabase/migrations/0003_portal_brokers_imoveis_ativos.sql`

`CREATE OR REPLACE VIEW public.portal_brokers` adicionando uma coluna
`imoveis_ativos`, mantendo as colunas atuais (`id, tenant_id, name, photo_url,
creci`) e a semântica da `0002` (`security_invoker = true`):

```sql
COALESCE((
  SELECT count(*) FROM public.imoveis_locais il
  WHERE il.tenant_id = m.tenant_id
    AND il.criado_por = m.user_id
    AND il.status_aprovacao = 'aprovado'
), 0) AS imoveis_ativos
```

Como a view é `security_invoker`, a subquery roda com o papel do chamador
(`anon`). É preciso liberar o `anon` a ler as colunas mínimas de
`imoveis_locais` necessárias para a contagem, escopado ao tenant Lotus —
seguindo exatamente o padrão que a `0002` já aplicou a `tenant_memberships`:

- `ALTER TABLE public.imoveis_locais ENABLE ROW LEVEL SECURITY;`
- Policy `anon` (`FOR SELECT TO anon`) com `USING (tenant_id = '<lotus>'::uuid)`.
- `REVOKE SELECT ON public.imoveis_locais FROM anon;` +
  `GRANT SELECT (tenant_id, criado_por, status_aprovacao) ON public.imoveis_locais TO anon;`
  — **somente** as 3 colunas da contagem. Nunca proprietário, valores,
  endereço.

Idempotente (BEGIN/COMMIT, `DROP POLICY IF EXISTS`, `lock_timeout`), como a
`0002`.

### 2. `lib/brokers.ts`

- Adicionar `imoveis_ativos` ao `.select(...)` de `getBrokers`.
- Adicionar `imoveisAtivos: number` ao tipo `Broker` e a `BrokerRow`
  (`imoveis_ativos`), mapeando no retorno.

### 3. `components/LotusCorretores.tsx`

- Em `realToBroker` (`:218`), preencher `active` com `imoveisAtivos` (hoje cai
  no default). O texto `{b.active} imóveis ativos` (`:456`) passa a exibir o
  número real. O tipo do parâmetro de `realToBroker` e o prop `brokers`
  (`:268`) ganham `imoveisAtivos`.

## Fora de escopo (marcar com `ponytail:` onde couber)

- **Status além de "aprovado":** conta só aprovado (alinhado ao site). Se
  surgir a necessidade de outra régua (ex.: incluir "em análise"), é um ajuste
  no `AND` da subquery.
- **Captador sem membership de corretor** (ex.: Fernanda, `role null`; imóvel
  de teste do owner): não vira card e não conta. Correto para o portal.
- **RPC `GROUP BY`:** desnecessária — a contagem é um subquery escalar por
  linha da view, sobre `imoveis_locais` (volume pequeno, indexável por
  `tenant_id`/`criado_por`). Só reconsiderar em escala muito maior.

## Verificação

Após aplicar a migration e o front:

1. `SELECT id, name, imoveis_ativos FROM portal_brokers WHERE tenant_id = '<lotus>'`
   (com anon key) retorna a coluna e Gabriele = 1, demais = 0 — batendo com a
   contagem direta de `imoveis_locais` aprovados por `criado_por`.
2. Nenhuma coluna sensível de `imoveis_locais` fica legível para o `anon` além
   de `tenant_id, criado_por, status_aprovacao` (testar um `select valor_venda`
   como anon deve falhar).
3. A página `/lotus-corretores` renderiza o número real no card, sem quebrar o
   fallback demo (`BROKERS_FALLBACK`) quando não há brokers reais.
