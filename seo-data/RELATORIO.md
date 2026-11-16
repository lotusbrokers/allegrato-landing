# Indexação no Google e no Bing: relatório de 16/11/2026

Branch `seo/indexacao`. **Nada disto está no ar ainda**: entra com o deploy (item 1 das Ações manuais).

## Resumo

Não achei bloqueio técnico que impeça a indexação. O robots.txt libera o site, o sitemap lista 241 páginas com data real, o conteúdo sai no HTML do servidor, as canonicals estão certas e as páginas respondem rápido.

As 160 páginas "não indexadas" do Search Console, pelo que dá para medir de fora, misturam dois grupos:

- páginas que o Google conhece e ainda não quis indexar: site novo, com 2 links de outros sites (linha de base de 16/10);
- endereços que não devem mesmo ser indexados: redirecionamentos, noindex de propósito, áreas logadas.

Para separar os dois grupos com certeza, falta o export do Search Console (Ações manuais, item 2).

O que dava para corrigir no código foi corrigido. O resto depende de texto da Lotus, de dados na Dash e de ações nas contas do Google e do Bing. Nenhuma correção garante indexação: quem decide é o buscador.

## 1. Diagnóstico (Fase 1)

**Stack.**
- Next.js 15 (App Router, React 19, TypeScript), com revalidação de 1 hora.
- Dados lidos do Supabase da Dash, somente leitura.
- 15 landings estáticas em `public/<slug>/index.html`.
- Docker no Easypanel (VPS Hostinger). Push na main faz o deploy em cerca de 5 minutos.

**Como foi medido.** `scripts/diagnostico-seo.mjs` partiu do sitemap e seguiu os links internos, com requisições reais em produção na manhã de 16/11.

Em cada uma das 249 páginas encontradas, o script mediu:
- status e redirecionamentos;
- tempo de resposta (TTFB);
- `X-Robots-Tag` e meta robots;
- canonical, título, descrição e H1;
- texto principal;
- tipos de JSON-LD;
- links recebidos e quase-duplicatas.

O resultado por página está em `seo-data/diagnostico.csv`, e o resumo em `seo-data/diagnostico-resumo.json`.

| Causa encontrada | Páginas | O que significa |
|---|---|---|
| Título com mais de 70 caracteres | 106 | O Google corta o título no resultado. Não impede a indexação. |
| Descrição fora de 70 a 160 caracteres | 23 | Também só corta o resultado. 17 são landings, 10 delas da Santa Angela, com a frase final obrigatória; as outras 6 são artigos do blog. |
| 2 links internos ou menos | 18 | Nenhuma página órfã. São 12 landings, 3 condomínios e 3 páginas com noindex, com 1 ou 2 links cada. |
| Conteúdo fino | 11 | Ver a Fase 3. |
| Meta robots noindex | 5 | De propósito: 4 guias de bairro sem texto e `/meus-dados`. |
| Sem JSON-LD | 4 | Corrigido (Gioviale, Oásis, Reserva Castanheira, Santorini). |
| Descrição repetida | 2 | Ecovillage I e II. Corrigido no código. |
| Fora do sitemap | 1 | New Garden: falta capa ou endereço na Dash. |

Gravidade: 5 alta (os noindex de propósito), 12 média, 108 baixa, 124 sem problema.

**O que provavelmente compõe as 160**

São hipóteses. O export do Search Console confirma.

| Motivo no Search Console | Origem provável | Precisa de correção? |
|---|---|---|
| Detectada ou Rastreada, mas não indexada | Pouca autoridade do domínio e páginas fracas | Conteúdo, links de fora e tempo |
| Página com redirecionamento | `http://` e domínio sem www; imóveis vendidos ou retirados (307 para a busca, de propósito); 2 posts fundidos (308) | Não |
| Página alternativa com tag canônica adequada | Busca com filtro (`/lotus-busca?tipo=...`), que aponta para `/lotus-busca` | Não |
| Excluída pela tag noindex | 4 guias sem texto e `/meus-dados` | Só os guias, quando tiverem texto |
| Bloqueada pelo robots.txt | `/area-do-corretor` e `/area-do-gestor`, linkadas no rodapé | Não |

## 2. Correções técnicas (Fase 2)

| Commit | O que mudou |
|---|---|
| `f999fd4` | O script de diagnóstico e o resultado de 16/11 (`seo-data/`). |
| `f14232f` | Título do condomínio: a forma mais completa que cabe em 70 caracteres, sempre com a cidade (46 dos 78 passavam). A descrição traz o nome do condomínio no trecho que aparece, e as fases do Ecovillage deixam de repetir a mesma. |
| `0c1190c` | Artigo do blog: o "\| Blog Lotus" só entra se couber em 70. Corrige 10 dos 21 títulos longos; os outros 11 precisam de um título curto (Fase 3). |
| `48e0811` | JSON-LD no Gioviale, Oásis, Reserva Castanheira e Santorini, só com o que a página mostra. Um teste passa a exigir JSON-LD válido em toda landing estática. |
| `dba6383` | IndexNow (Fase 4). |
| `439a749` | O plano de conteúdo (`seo-data/conteudo.csv`). |
| `f691d04` | Datas de alteração do sitemap (só as 4 landings mudaram). |

Verificação:
- 329 testes passam.
- O build passa.
- O `tsc` só acusa o erro de sempre dos testes (import com `.ts`).
- No servidor local, o arquivo da chave do IndexNow responde 200 na raiz.
- As 4 landings saem com o JSON-LD.

**Conferido e sem mudança necessária:**
- **robots.txt:** bloqueia só `/api/` e as áreas logadas.
- **Sitemap:** 241 URLs, todas com lastmod vindo de commit ou do `updated_at` da Dash, nunca da hora do build. Páginas com noindex ficam fora.
- **Canonical:** uma por página, apontando para o endereço com www.
- **Renderização:** o texto está no HTML do servidor, sem depender de JavaScript.
- **TTFB:** medianas entre 65 e 338 ms, nenhuma acima de 1,5 s.
- **Links internos:** nenhuma página órfã.
- **hreflang:** não se aplica (só português).
- **Parâmetros:** a busca filtrada aponta canonical para a página limpa.

**Não mudei, e por quê:**
- **Títulos das 38 landings** ("\| Imobiliária Lotus Brokers"): o formato é exigência de conformidade (padrão P2 da auditoria de 01/10 e regras da Santa Angela). Trocar o sufixo por "\| Lotus Brokers" ainda deixaria 33 acima de 70. Só a reescrita do meio do título resolve, e essa decisão é da Lotus. Título longo não impede a indexação.
- **Descrições das landings da Santa Angela** (até 200 caracteres): a frase final é obrigatória. As outras 7 landings passam de 160 por pouco (161 a 190) e só perdem o fim no resultado.
- **Imóvel vendido ou retirado responde 307 para a busca:** decisão documentada em `lib/imovel-que-saiu.ts`, porque o imóvel pode voltar.
- **Links do rodapé para as áreas logadas:** o bloqueio no robots.txt é o correto, e esse motivo no Search Console é só informativo.

## 3. Conteúdo (Fase 3)

`seo-data/conteudo.csv`: 26 páginas, cada uma com o problema, a recomendação, quem faz, a prioridade e um brief curto. Nada foi escrito no lugar da Lotus.

- **Melhorar (23):**
  - 4 guias de bairro sem texto (seguem com noindex até o texto chegar);
  - 3 páginas de construtora (MRV, Terriá Incorporadora, Trend Canadá);
  - o artigo da Serra do Japi;
  - o índice de guias (prioridade baixa);
  - 3 condomínios que dependem de dados na Dash;
  - 11 artigos com título sugerido, tirado do próprio título, para aprovar.
- **Consolidar (1):** "Itupeva em crescimento" dentro de "Vantagens de morar em Itupeva", com 308. Muda uma URL, então só com o OK da Lotus.
- **Manter (2):**
  - `/meus-dados`, com noindex correto;
  - `/lotus-busca/casas-em-itupeva`, fina por falta de casas no acervo e não de texto. Não pôr noindex.

## 4. Bing e Google (Fase 4)

**IndexNow** é o aviso de "esta página mudou" que o Bing, o Yandex, o Seznam, o Naver e o Yep aceitam.
- A chave está em `public/957850290d08780a19bcbca20f22ee04.txt`; ela é pública por desenho do protocolo.
- O script `scripts/indexnow.mjs` lê o sitemap e só envia com `--enviar`.
- Antes de enviar, o script confere que a chave já está no ar. Por isso o envio só vale depois do deploy.

```bash
node scripts/indexnow.mjs --enviar
```

O comando acima é para a primeira vez, logo depois do deploy: envia as 241 URLs.

```bash
node scripts/indexnow.mjs --desde 2026-11-16 --enviar
```

Depois disso, use `--desde` só com o que mudou desde a data. Reenviar página igual não adianta.

**O Google não participa do IndexNow.** Para ele, os caminhos são o sitemap no Search Console e a inspeção de URL (itens 2 e 3 abaixo).

## Ações manuais

Não tenho acesso às contas do Search Console, do Bing Webmaster Tools, do Easypanel nem da Dash. Nada abaixo foi feito.

1. **Deploy.**
   - Levar a branch `seo/indexacao` para a main (é o "commit changes").
   - A branch também leva 3 commits locais anteriores que esperavam o mesmo pedido: o texto do Sobre (D026), a página de cada corretor e uma atualização das datas do sitemap.
   - O Site do Cliente não está em commit nenhum.
2. **Search Console: exportar o relatório "Páginas"**, com as não indexadas por motivo. Com ele dá para confirmar as hipóteses da tabela da Fase 1 e achar o que o rastreamento de fora não vê.
3. **Search Console, depois do deploy:**
   - conferir se o sitemap `https://www.lotusbrokers.com.br/sitemap.xml` está enviado e lido;
   - inspecionar e pedir indexação das páginas comerciais que aparecerem como "Detectada, mas não indexada" (a cota é de poucas por dia);
   - usar "Validar correção" nos motivos corrigidos.
4. **Bing Webmaster Tools:**
   - adicionar o site (importar do Search Console é o caminho mais curto);
   - enviar o mesmo sitemap;
   - depois do primeiro `--enviar`, conferir a aba IndexNow.
5. **Easypanel:** fazer `http://lotusbrokers.com.br` ir direto para `https://www.lotusbrokers.com.br` num salto só. Hoje são dois (301 do proxy e depois 308 do site).
6. **Dash:**
   - **New Garden:** completar a capa e o endereço. A página volta sozinha ao sitemap e ao índice de condomínios.
   - **Ecovillage I e II:** um texto próprio para cada fase.
   - **Vivart Grand Alamedas:** o bairro está gravado como "Av. Juvenal Arantes", que é uma rua. Com o bairro certo, o guia do bairro (se houver) passa a linkar a landing.
   - **Terrace Serra do Japi:** está como "Jardim das Samambaias", e o guia é do "Jardim Samambaia". Se for o mesmo bairro, gravar igual, ou me confirmar para eu pôr no mapa de pertencimento (`lib/bairros-taxonomia.ts`).
   - **SKY Videiras:** o card mostra "56-71m", e a landing, de 56,96 a 83,31 m².
7. **Textos e decisões da Lotus:** os itens de `seo-data/conteudo.csv`.
   - 4 guias, 3 construtoras, o artigo da Serra do Japi.
   - Aprovar os 11 títulos.
   - Decidir a consolidação do post de Itupeva.
   - Decidir se reescreve os títulos das landings.
8. **Links de outros sites**, o que mais pesa no "Detectada, mas não indexada" de um domínio novo. O plano de 27/10 já está pronto em https://claude.ai/artifact/4DDCgqWydSrrBZWDy2aKDY: perfis com o mesmo nome, endereço e telefone, avaliações, as construtoras, imprensa local. Sem compra de link nem troca artificial.

## Como acompanhar

- **Linha de base de 16/10:** 30 páginas indexadas, 170 detectadas e não indexadas, 15 sem www, 2 links externos.
- **Comparar:** o relatório "Páginas" do Search Console de 2 a 4 semanas depois do deploy.
- **Medir de novo de fora:** depois do deploy, `node scripts/diagnostico-seo.mjs`.
