---
tags: [lotus, dev-handoff, dash, lia, portal, site-do-cliente]
tipo: ticket pro dev da Octo Dash
área: Lotus Brokers — Portal + CRM (leads)
criado: 2026-11-16
status: 🔴 pendente dev
---

# 🛠️ DEV — Site do Cliente: página pessoal do lead (Fase 1)

> **Pedido do Erick e plano aprovado em sessão Claude + Erick em 16/11/2026 (conversa estratégica).** Este arquivo mora no repositório do portal, ao lado do SQL proposto; copiar para `2. LOTUS/_PARA-DEVS/`.

## Problema

A Lotus quer que cada lead ganhe uma página pessoal, `lotusbrokers.com.br/erick.ferrigatti/<token>`, gerada pelo corretor com um clique e **salva dentro do lead**. Ela traz:
- os imóveis escolhidos, com fotos, valor, simulação e o texto "por que combina";
- a lista de favoritos do cliente;
- o compartilhamento com quem decide junto, com ❤️/👎;
- o rastreamento do que o cliente olha;
- um aviso ao corretor quando o cliente abre a página 3 vezes no mesmo dia.

O portal não tem onde guardar nada disso:
- usa só a chave pública do Supabase, que só lê;
- o lead mora na Dash e chega lá pelo webhook da LIA;
- os favoritos da Área do Corretor ficam guardados só no aparelho.

**Comportamento atual:** não existe página do cliente. O site lê imóveis e corretores e manda leads para a LIA, sem ler lead de volta.
**Comportamento esperado:**
1. O corretor clica em "Gerar página do cliente" no lead e recebe o link.
2. O cliente abre a página, favorita e compartilha com quem decide junto.
3. O corretor vê os eventos no lead e recebe, pela LIA, "O Erick está olhando o AP0018 agora, ligue" na 3ª abertura do dia, uma vez por dia.

## O que precisamos

- Um lugar no banco da Dash, ligado ao lead, para a página, a seleção, os favoritos, os convidados, os votos, os eventos e os avisos.
- O portal precisa ler e gravar ali **sem chave de serviço** e sem expor o lead: o acesso é pelo token da página.
- Um caminho para o aviso chegar ao corretor pelo WhatsApp, que já é o canal da LIA, sem duplicar.

**Opções possíveis:**

### Opção A · Tabelas no banco da Dash + funções com token (security definer)
- **Como funciona:**
  - Sete tabelas novas ligadas ao lead, com RLS e sem nenhuma permissão para o anon.
  - O portal chama funções do banco com a chave pública, e cada função valida o token e o papel (cliente, convidado ou convite).
  - O corretor logado edita a seleção pela Área do Corretor do portal, com a sessão dele (RLS).
- **Prós:** o dado fica dentro do lead; menor privilégio; a distribuição e o WhatsApp seguem onde já estão.
- **Contras:** depende do dev da Dash para aplicar a migration, pôr o botão e criar o endpoint na LIA.

### Opção B · Banco próprio do portal + webhook para a Dash
- **Como funciona:** outro Postgres só do portal, que manda uma cópia de cada evento para a Dash.
- **Prós:** o portal anda sozinho.
- **Contras:** duplica o lead, "dentro do lead" vira só um link, e são dois bancos para manter. O aviso e a indicação continuam dependendo da LIA.

### Opção C · Chave de serviço no servidor do portal (bônus)
- **Como funciona:** o portal grava direto nas tabelas da Dash pelas rotas de servidor.
- **Prós:** o mais rápido de fazer.
- **Contras:** um vazamento do servidor do portal abre o banco inteiro da Dash. Fica descartada.

**Recomendação:** Opção A · é o único jeito de a página morar dentro do lead sem dar ao site mais acesso do que ele precisa.

## Dados / contexto adicional

**SQL proposto (Opção A):** `supabase/migrations/0007_site_do_cliente.sql`, no repositório do portal. Segue o padrão das migrations 0002 a 0006, com "CONFIRMAR antes de rodar". É idempotente.

| Tabela | Para quê |
|---|---|
| `cliente_paginas` | Uma por lead: corretor, slug, os 3 tokens, modo (seleção, proposta, acompanhamento), mensagem, consentimento, pedido de remoção |
| `cliente_pagina_imoveis` | A seleção do corretor: ordem, "por que combina", simulação **anexada** (o site não calcula parcela, por decisão de 2026) |
| `cliente_pagina_favoritos` | "Minha lista" do cliente, com ordem |
| `cliente_pagina_convidados` | Quem decide junto: o nome e o token de cada um (até 20) |
| `cliente_pagina_votos` | ❤️/👎, um por pessoa e imóvel |
| `cliente_pagina_eventos` | Linha do tempo (abriu, viu imóvel, tempo, favoritou, votou, comparou, compartilhou); a chave única faz o reenvio não duplicar |
| `cliente_pagina_avisos` | Um aviso por página, tipo e dia (São Paulo): é o que impede aviso duplicado |

**Funções que o portal chama (validam o token):**
- `pagina_do_cliente`
- `entrar_como_convidado`
- `registrar_evento`
- `registrar_aviso`
- `favoritar`
- `reordenar_favoritos`
- `votar`
- `registrar_consentimento`
- `pedir_remocao`

**Funções do corretor logado:**
- `lead_para_pagina`
- `gerar_pagina_do_cliente`: recebe os slugs candidatos já em ordem, e o primeiro livre vence.

**Regras do lado do portal (com teste no repositório):**
- **Slug:** "nome.sobrenome", sem acento. Em colisão, "-2", "-3"…
- **Regra das 3 aberturas:**
  - uma abertura é o carregamento da página 10 min ou mais depois da anterior;
  - só conta o cliente;
  - o dia segue o fuso de São Paulo.
- **Permissões de convidado:** nunca simulação, renda nem documentos.

**Fluxo de geração (um clique):**
1. O botão no lead da Dash abre `https://www.lotusbrokers.com.br/area-do-corretor/clientes/nova?lead=<lead_id>`.
2. O corretor já está logado com o login da Dash.
3. O portal monta o slug, chama `gerar_pagina_do_cliente` e mostra o link para copiar ou mandar no WhatsApp.
4. A seleção se edita na Área do Corretor.

**Fluxo do aviso:**
1. O portal registra a abertura e aplica a regra.
2. Se a regra bater, chama `registrar_aviso`, que só devolve dados na 1ª vez do dia.
3. O portal posta na LIA, pelo servidor e com o segredo, como já faz com os leads, um evento `aviso_corretor` com o lead, o corretor, o primeiro nome e o imóvel.
4. A LIA manda o WhatsApp ao corretor.

## Workaround até dev entregar

- **Sem o botão na Dash:** o corretor abre `/area-do-corretor/clientes/nova?lead=<id>`, com o id copiado do endereço do lead na Dash.
- **Sem o endpoint da LIA:** o aviso fica gravado em `cliente_pagina_avisos` e aparece na Área do Corretor.
- **Sem a migration:** o portal roda com dados de teste no ambiente local. Nada vai ao ar.

## Perguntas pro Erick antes do dev começar

Decididas em 16/11/2026, aceitando as sugestões do plano:
1. A Opção A.
2. Botão no lead da Dash, com a edição na Área do Corretor.
3. Aviso por WhatsApp via LIA.
4. Link no formato `/nome.sobrenome/<token>`.
5. Simulação anexada pelo corretor.
6. Consentimento com "Aceitar", sem caixa pré-marcada.
7. A regra dos 10 minutos para contar abertura.
8. O convidado não vê simulação nem documentos.

Em aberto:
1. Quais campos de perfil do lead existem hoje (renda, entrada, parcela-alvo, o que procura)? Eles pré-preenchem o "por que combina" e o "cabe no meu bolso" da Fase 2.
2. Prazo para apagar de vez os dados de quem pede remoção: a página some na hora, mas o apagamento definitivo precisa de um prazo, que a política de privacidade do site (`/lotus-privacidade`) deve dizer.

## Perguntas pro dev

- **Leads:**
  - Nome da tabela e das colunas: `id` (é uuid?), `tenant_id`, `nome`, e qual coluna guarda o corretor responsável da distribuição.
  - O id do lead aparece no endereço da tela do lead na Dash? É o que o link do botão leva.
- **Corretor:**
  - `cliente_paginas.corretor_id` deve apontar para `tenant_memberships.id`, que é o mesmo `portal_brokers.id`, ou para `user_profiles.id`?
  - Quais papéis veem e editam páginas de outros corretores (`team_leader`, `admin`, `owner`)?
- **LIA:** dá para receber um evento `aviso_corretor` no webhook e mandar WhatsApp ao corretor do lead? Ou é melhor um Database Webhook do Supabase em `cliente_pagina_avisos`, com a coluna `entregue_em` preenchida pela LIA?
- **Tela do lead:** a Dash já tem uma linha do tempo onde os eventos de `cliente_pagina_eventos` possam entrar, mostrando o que ele olhou e por quanto tempo?
- **Banco:** a extensão `pgcrypto` está ativa?
- **Aplicação:** algum horário preferido para aplicar a migration?

## Revisão do protótipo (16/11/2026, Erick)

O esqueleto `docs/prototipos/site-do-cliente.html` ganhou quatro ajustes, marcados como "novo" na página.

1. **Mini mapa na Seleção.** Um pino numerado por imóvel, na ordem dos cartões, no endereço exato (decisão do Erick em 16/11). Tocar no número leva ao imóvel. O convidado vê o mesmo mapa.
2. **Notas de 0 a 5** em cinco tópicos, por imóvel: valor, localização, planta, condomínio/bairro e oportunidade.
   - Cada pessoa dá as suas notas, cliente e convidados.
   - O cartão mostra a média.
   - O comparador ganha as cinco linhas, a média de cada um e a média dos convidados, com o melhor de cada linha destacado.
3. **Proposta com documentos.**
   - A página mostra os estados da proposta e a lista de documentos com o status de cada um.
   - A proposta assinada abre com um clique.
   - O envio e a visualização dos documentos ficam no portal do cliente que a Dash já tem. A página do cliente só mostra o status e leva até lá.
4. **Acompanhamento é o pós-venda.** Depois da proposta assinada, a página mostra as etapas do Jurídico até a venda finalizada, com a etapa atual destacada e com quem ela está.
   - A lista muda com o tipo de negócio, Pronto ou Lançamento, como na Dash. A obra do lançamento fica fora da página (decisão do Erick em 16/11).
   - Quando o Jurídico move o negócio de etapa na Dash, a página muda junto.

Na mesma tarde o Erick confirmou que as etapas são as do Jurídico da Dash e pediu os dois lados ligados, da proposta até a finalização da venda. A Dash foi lida no navegador, com o login dele, só para ver nomes e estrutura: nada foi alterado lá, e nenhum dado de cliente foi copiado para cá.

### O que a Dash já tem (Jurídico, lido em 16/11/2026)

- **Negócio do Jurídico** (`/juridico/negocio/<id>`), com as abas Formulário, Documentos, Certidões, Conferir, Dossiê, Participantes, Histórico, CCV, Escriturar, Convidar, Agenda, Solicitação e Assinatura eletrônica.
- **Proposta e contrapropostas**, com os estados Negociação, Proposta, Respondidas, Contrato, Assinadas e Arquivadas. Cada estado tem um percentual na tela (35%, 65%, 72%, 86%, 100%).
- **Tipo do negócio:** Lançamento ou Pronto. Também guarda se é com ou sem financiamento.
- **Etapas e subetapas do Jurídico**, no quadro (Kanban) e no "Mover etapa" do negócio:

  | Etapa | Subetapas no Pronto | Subetapas no Lançamento |
  |---|---|---|
  | Proposta aceita | Em negociação | Em negociação |
  | Contrato | Due diligence, Feitura, Em análise, ITBI, Escritura, Registro | Termo de comissionamento |
  | A receber | Aguardando o pagamento | Aguardando a construtora |
  | Recebido | | |
  | Pós-vendas | Relacionamento | Relacionamento |

- **Responsável pela etapa**, por subetapa: Imobiliária, Construtora, Cliente, Banco ou Cartório. Há prazo por subetapa ("previsto dd/mm", "n de m dias úteis", "atrasado").
- **Pendências** do negócio: proposta assinada, termo, WhatsApp, certidões, ficha de visita.
- **Documentos** do comprador, com status ("Faltam n de 7"): RG ou CNH, CPF, Comprovante de residência, Holerite, Declaração de imposto de renda, Extrato do FGTS, Certidão.
- **Link do portal do cliente**, gerado no negócio pelo botão "Gerar link". O texto da tela diz: "A pessoa abre o link e digita o próprio telefone. A Dash não envia nada."
- **Linha do tempo e Histórico** do negócio.

Tudo o que a Fase 3 precisava (proposta, documentos, assinatura, etapas com responsável e prazo) já existe na Dash. O Site do Cliente não deve refazer nada disso: lê o estado e leva até o portal da Dash.

### Vínculo nos dois sentidos (o que o dev da Dash faz)

1. **Da Dash para o Site do Cliente.** No negócio do Jurídico, ao lado do "Link do portal do cliente", aparece o link do Site do Cliente do mesmo lead (`cliente_paginas`, pelo `lead_id`), com os botões copiar e abrir. Vale também na tela do lead.
2. **Do Site do Cliente para a Dash.** Uma função nova, no padrão das outras (security definer, valida o token do cliente), devolve em JSON os negócios do Jurídico ligados ao lead. Para cada um:
   - tipo (Lançamento ou Pronto) e com ou sem financiamento;
   - estado da proposta;
   - etapa, subetapa, responsável pela etapa e previsto;
   - data de cada mudança (do Histórico);
   - documentos, com tipo e status;
   - se a proposta está assinada, e o arquivo dela;
   - o link do portal do cliente, quando já gerado.

   O nome sugerido é `pagina_do_cliente_juridico(p_token text)`. O dev escreve com as tabelas reais, que não aparecem para o portal.
3. **Modo da página pela Dash.**
   - Sem negócio no Jurídico, a página fica em Seleção.
   - Com negócio e proposta ainda não assinada, vai para Proposta.
   - Com "Assinadas", vai para Acompanhamento, até Pós-vendas.
   - O campo `modo` de `cliente_paginas` deixa de ser editado à mão e passa a seguir o negócio.
4. **Sem link do portal ainda.** Se o Jurídico não gerou o link, a página mostra "Seu corretor vai liberar o envio dos documentos", em vez do botão.
5. **Aviso de etapa nova (opcional).** Um Database Webhook na mudança de etapa permite à LIA mandar WhatsApp ao cliente.

### Nomes das etapas: Dash → página do cliente

A página usa os nomes da Dash, com três ajustes para quem compra, aprovados pelo Erick em 16/11:

| Na Dash | Na página do cliente |
|---|---|
| Proposta aceita › Em negociação | Proposta aceita (em negociação até as assinaturas) |
| Contrato › Due diligence, Feitura, Em análise, ITBI, Escritura, Registro | Contrato · nome da subetapa, com uma linha de explicação (ex.: Feitura = redação do contrato) |
| Contrato › Termo de comissionamento (lançamento) | Contrato. O termo é da comissão da Lotus com a construtora e não aparece para o cliente |
| A receber, Recebido | Compra concluída. São a comissão da Lotus, não uma etapa do cliente |
| Pós-vendas › Relacionamento | Pós-vendas · Relacionamento |
| Responsável pela etapa = Cliente | "Agora é com você", com a pendência |
| Responsável = Imobiliária, Construtora, Banco ou Cartório | "Agora está com a Lotus", "com a construtora", "com o banco", "com o cartório" |

### Documentos e assinatura: pela Dash

- A página mostra a lista e o status da aba Documentos, e um botão que abre o portal do cliente da Dash, onde a pessoa digita o telefone e envia ou vê os arquivos.
- A proposta assinada vem da Assinatura eletrônica do negócio, ou do PDF que o Jurídico anexar.
- Nenhum arquivo passa pelo site da Lotus. Não há upload próprio nem cópia, então não há nada a migrar.
- Isso substitui o desenho anterior desta revisão (envio na própria página com código de 6 dígitos no WhatsApp). A verificação passa a ser a do portal da Dash, que pede o telefone.
- Decidido em 16/11: a verificação por telefone do portal da Dash basta para os documentos. Fica registrado que ela protege menos que um código enviado na hora, porque quem tem o link e sabe o telefone entra.

### Fases

- **Fase 1, se o desenho for aprovado:** notas e mini mapa. As notas entram na 0007 antes de aplicar. O mini mapa depende das coordenadas e pode vir depois.
- **Fase 3:** a leitura do Jurídico (a função acima), o link nos dois sentidos e as telas de Proposta e Acompanhamento. Documentos e assinatura já existem na Dash.

### Perguntas novas pro Erick

Decididas em 16/11/2026:
1. "A receber" e "Recebido" aparecem para o cliente como "Compra concluída", e o "Termo de comissionamento" só como "Contrato".
2. A verificação por telefone do portal da Dash basta para os documentos.
3. A obra do lançamento fica fora da página.
4. Notas também dos convidados: cada pessoa dá as suas, e o comparador do cliente mostra as dele e a média dos convidados.
5. Mini mapa no endereço exato do imóvel.

### Perguntas novas pro dev

- **Jurídico:** em quais tabelas ficam o negócio, a proposta com os estados, a etapa e a subetapa, o responsável, o previsto e o histórico? Um lead pode ter mais de um negócio?
- **Portal do cliente:** o link gerado é fixo por negócio, e dá para a função devolvê-lo? Ele expira?
- **Documentos e assinatura:** onde ficam o status de cada documento e o arquivo da proposta assinada, para a função devolver um link de vida curta?
- **Vínculo:** dá para mostrar o link do Site do Cliente no negócio do Jurídico e na tela do lead?
- **Imóvel:** o pino vai no endereço exato.
  - O cadastro tem latitude e longitude?
  - Se não tiver, dá para calcular uma vez, a partir do endereço completo, e guardar no imóvel? A função que entrega a seleção à página passa a devolver as duas.
- **Eventos:** dá para disparar um Database Webhook na mudança de etapa, para a LIA avisar o cliente?

## Conexões
- [[DEV — LIA backlog (05-10-2026)]] (novo evento `aviso_corretor` no webhook)
- SQL: `supabase/migrations/0007_site_do_cliente.sql` (repositório do portal)

*Criado 2026-11-16 por Claude + Erick.*
