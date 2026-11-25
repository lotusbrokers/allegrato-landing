---
tags: [lotus, dev-handoff, dash, lancamentos, tipologias, bug]
tipo: ticket pro dev da Octo Dash
área: Lotus Brokers — Lançamentos (tipologias)
criado: 2026-11-19
status: 🔴 pendente dev
---

# 🛠️ DEV — Tipologia nova não salva em lançamento que já tem tipologias

> **Descoberto em sessão Claude + Erick em 19/11/2026, subindo pelo navegador interno a tabela 1634 do Allegrato (Torre A, válida a partir de 01/11/2026).** Este arquivo mora no repositório do portal; copiar para `2. LOTUS/_PARA-DEVS/`.

## Problema

Em `/imoveis/lancamentos/<id>`, quando o lançamento já tem tipologias salvas e se acrescenta uma linha com "+ Tipologia", o "Salvar" falha com o alerta "Não foi possível salvar as tipologias. O lançamento não foi alterado.". Nada é gravado: nem a linha nova, nem as alterações das linhas antigas, nem os Dados do Portal.

Resposta do Supabase ao `POST /rest/v1/tipologias?on_conflict=id&columns=…`:

```
400 {"code":"23502","message":"null value in column \"id\" of relation \"tipologias\" violates not-null constraint"}
```

**Causa:**
- `ur()` (LancamentoViewPage) grava todas as linhas num só `upsert(m, { onConflict: "id" })`.
- As linhas antigas levam `id` e as novas não (`...x.id ? { id: x.id } : {}`).
- Recebendo um array, o supabase-js monta `columns` com a união das chaves de todas as linhas.
- Por padrão (`defaultToNull: true`), o supabase-js preenche com NULL a chave que falta numa linha. A linha nova vai então com `id = NULL`, e não com o default da coluna.

**Comportamento atual:** só se cria tipologia em lançamento que não tem nenhuma (aí nenhuma linha tem `id`). Num lançamento com tipologias, só dá para editar as existentes.
**Comportamento esperado:** acrescentar tipologia em qualquer lançamento.

## O que precisamos

Acrescentar plantas a um lançamento que já tem plantas, sem apagar e recriar as existentes.

### Opção A · `defaultToNull: false` no upsert
- **Mudança:** `P.from("tipologias").upsert(m, { onConflict: "id", defaultToNull: false })`. O supabase-js manda `Prefer: missing=default`, e a chave que falta usa o default do banco.
- **Prós:** muda uma linha, e a gravação continua numa ida só ao banco.
- **Contras:** toda chave ausente passa a usar o default, não só o `id`. Hoje `m` manda todas as outras colunas, então só o `id` muda de comportamento.

### Opção B · `id` gerado no navegador
- **Mudança:** a linha nova nasce com `id: crypto.randomUUID()`.
- **Prós:** todas as linhas chegam com as mesmas chaves.
- **Contras:** supõe que o `id` é um uuid sem regra própria no banco.

### Opção C · duas chamadas
- **Mudança:** `upsert` das linhas com `id`, depois `insert` das linhas sem `id`.
- **Prós:** explícito.
- **Contras:** duas idas ao banco. Se a segunda falhar, a primeira já gravou, e a mensagem "O lançamento não foi alterado" deixa de ser verdade.

**Recomendação:** Opção A. É uma linha e mantém a gravação tudo ou nada.

## Dados / contexto adicional

Tipologias que ficaram de fora por causa do erro. Subir assim que corrigir. Valores revistos em 25/11/2026: no Allegrato, só as unidades disponíveis (as verdes da tabela).

**Allegrato (L030), Torre A, tabela 1634:**

| Nome | Dorms | Suítes | Vagas | Área m² | A partir de R$ |
|---|---|---|---|---|---|
| 2 dorms · 63,75 m² · Torre A, finais 03 e 04 | 2 | 0 | 1 | 63,75 | 467.642,19 (unid. 13) |
| 2 dorms · 64,62 m² · Torre A, final 07 | 2 | 0 | 1 | 64,62 | 507.937,89 (unid. 107) |

**Vistta Castanho, tabela de novembro/2026 (R$ 2.232,50 o m²).** O mesmo erro em 25/11/2026 deixou de fora 5 faixas de lote:

| Lotes | A partir de R$ |
|---|---|
| 133,96 a 136,43 m², Quadra I | 299.065,70 |
| 171,96 a 177,63 m², Quadra I | 383.900,70 |
| 237,89 m², D21 | 531.089,42 |
| 327,03 m², D20 | 730.094,47 |
| 393,45 m², D19 | 878.377,12 |

O que entrou em 19/11/2026 às 10:32, só nas linhas que já existiam:
- **55,12 m² · Torre A, final 01:** R$ 360.334,56.
- **63,05 m² · Torre A, final 08:** R$ 441.131,87 e 1 vaga.
- **Valor mínimo:** "a partir de R$ 360.334".

As tipologias das Torres B/C/D continuam sem preço, porque a tabela 1634 é só da Torre A.

No navegador interno do Claude, os diálogos nativos estão desligados, então o alerta da Dash não aparece. O erro só aparece no console.

## Workaround até o dev entregar

Nenhum seguro pela tela. Daria para apagar todas as tipologias e recriar todas numa gravação só, em que nenhuma linha teria `id`. Mas isso troca os ids e apaga as linhas existentes, e não foi feito.

## Perguntas pro Erick antes do dev começar

1. As duas plantas entram assim que o dev avisar, ou há outra tabela da Torre A a caminho que substitua esta?

## Perguntas pro dev

- O `id` de `tipologias` tem default (`gen_random_uuid()`)? O erro mostra que a coluna é NOT NULL, e a Opção A depende de haver default.
- Outras gravações em lote que misturam linhas novas e antigas no mesmo `upsert` (espelho de vendas, plantão, imagens) têm o mesmo problema?

## Conexões

- Memória do portal: preço de lançamento na Dashboard (tipologias + "Valor mínimo").

*Criado 2026-11-19 por Claude + Erick.*
