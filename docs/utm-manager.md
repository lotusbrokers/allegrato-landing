# UTM Manager

Ferramenta interna da Lotus Brokers para as UTMs das campanhas **ativas** do Meta Ads: importar o CSV do Gerenciador de
Anúncios, gerar e copiar os parâmetros no padrão da Lotus, auditar o rastreamento de cada anúncio, exportar e guardar o
histórico. Primeira versão: 28/10/2026, a partir do briefing "Lótus UTM Manager".

## Onde fica e quem entra

- Rota: **`/area-do-gestor/utm`**, dentro da Área do Gestor. Também há um atalho "UTM Manager" na página inicial da Área do Gestor.
- Entrada com a conta da Dashboard (OctoDash), na mesma tela da Área do Corretor.
- Só entra quem é **owner** ou **admin** no tenant da Lotus, a mesma regra da Área do Gestor (`exigirGestor`, em `lib/area-do-corretor/sessao.ts`).
- **Como a proteção funciona:**
  - o `middleware.ts` exige sessão em `/area-do-gestor/*`;
  - cada página e cada Server Action conferem o papel no servidor;
  - o Next confere a origem das Server Actions (CSRF);
  - a área sai com `noindex`, está bloqueada no `robots.txt` e fica fora do sitemap.
- **Papel de marketing:** a Dashboard não tem um papel só para marketing (os papéis são owner, admin, team_leader, corretor e financeiro). Se ele for criado, basta incluí-lo na regra de acesso (`podeGerenciar` em `lib/area-do-corretor/acesso.ts`, ou uma regra própria do UTM Manager).

## Arquitetura

| Parte | Arquivo | Faz |
|---|---|---|
| Leitura do CSV | `lib/utm/csv.ts` | RFC 4180 (aspas, quebra de linha no campo), vírgula, ponto e vírgula ou tabulação, BOM, UTF-8/UTF-16/Windows-1252; escrita com proteção contra fórmula |
| Colunas | `lib/utm/colunas.ts` | Reconhece os cabeçalhos do Meta em português e inglês; mapeamento manual na tela |
| Status | `lib/utm/status.ts` | Status configurado de campanha, conjunto e anúncio, separado da veiculação; quem é elegível |
| Importação | `lib/utm/importacao.ts` | Validação no servidor, prévia, duplicidades, gravação preservando os campos da equipe |
| URL | `lib/utm/url.ts` | Valida destino, preserva parâmetros e fragmento, mantém as macros da Meta, detecta conflito |
| Gerador | `lib/utm/gerador.ts` | Modo dinâmico (texto para "Parâmetros de URL") e estático (link pronto, sem inventar valores) |
| Auditoria | `lib/utm/auditoria.ts` | Verificações com severidade configurável |
| Exportação | `lib/utm/exportar.ts` | CSV para Excel (`;`, UTF-8 com BOM) |
| Empreendimentos | `lib/utm/empreendimentos.ts` | Catálogo do site e cadastros manuais; associação pela URL de destino |
| Armazém | `lib/utm/armazem.ts` | Arquivo JSON no servidor, gravação atômica e em fila |
| Meta API (fase 2) | `lib/utm/meta-api.ts` | Só a interface e a situação "Não configurada" |
| Telas | `app/area-do-gestor/utm/**`, `components/utm/**` | Páginas, Server Actions (`acoes.ts`) e componentes |

### Por que um arquivo e não o Supabase

O site só lê o Supabase da Dashboard, por regra da Lotus, e criar tabela lá é trabalho do time da Dashboard. Para algumas centenas de anúncios ativos, um arquivo resolve:
- **Gravação:** cada alteração lê, muda e grava o estado inteiro, uma de cada vez, trocando o arquivo de forma atômica. Uma importação entra inteira ou não entra.
- **Recuperação:** a versão anterior fica em `estado.anterior.json`. Se o `estado.json` estiver ilegível, a ferramenta para e não grava por cima.

**Quando trocar:** se o site passar a rodar em mais de uma instância, ou os registros chegarem a milhares, é hora de um banco próprio. A troca mantém `ler()` e `alterar()` como interface.

## Implantação (Easypanel)

1. **Criar um volume persistente** no serviço do site, por exemplo montado em `/data`.
2. **Criar a variável de ambiente** `UTM_DATA_DIR=/data/utm`.
3. **Publicar** (push em `main`). A Visão geral deixa de mostrar o aviso de dados não persistentes.

Sem `UTM_DATA_DIR`, os dados ficam em `.dados/utm` dentro do projeto (ignorado pelo git). Isso serve no computador, mas **some a cada deploy**; a ferramenta avisa em produção.

**Uma instância só:** a fila de gravação é do processo. Com mais de uma instância do site, ver "Quando trocar", acima.

## Uso

### Primeira importação

1. **Exportar do Meta Ads:** no Gerenciador de Anúncios, exporte os anúncios ativos em CSV. O formato de edição em massa traz o status dos três níveis, a URL e os parâmetros.
2. **Não abrir no Excel antes:** ele transforma os IDs da Meta em notação científica e corta dígitos. A importação recusa esses IDs.
3. **Ler e mapear:** em **Importar CSV**, escolha o arquivo. As colunas são reconhecidas sozinhas; confira e mapeie à mão o que faltar.
4. **Conferir a prévia:** **Ver a prévia** mostra cada linha: elegível, fora do escopo (com o motivo) ou para revisar. Nada é gravado ainda.
5. **Importar:** marque os elegíveis e clique em **Importar**. O relatório mostra novos, atualizados, duplicados e ignorados.

**Colunas obrigatórias:** ID e nome da campanha.

**Recomendadas:**
- ID e nome do conjunto e do anúncio;
- status da campanha, do conjunto e do anúncio;
- veiculação;
- URL de destino (Link);
- parâmetros de URL (URL Tags).

**Opcionais:**
- conta de anúncios;
- objetivo;
- posicionamento;
- datas de início e término.

**Regra de elegibilidade:** entra quem está ligado em todos os níveis até o seu.
- **Anúncio pausado em campanha ativa** fica de fora.
- **Sem algum desses status**, vale a veiculação; sem os dois, o registro vai para revisão. A ferramenta não presume que está ativo.
- **"Ligado, sem veicular"** (agendado, em análise) entra, com o aviso.

**Reimportar:**
- **Não duplica:** o registro é identificado pelos IDs da Meta.
- **Atualiza** o que veio do CSV.
- **Preserva** o que a equipe editou: associação manual, observações e a etapa da UTM.
- **Já cadastrado que voltou desligado:** o status é atualizado.
- **O que não veio no arquivo:** fica marcado como "não veio na última importação". Nada é apagado.

### Corrigir campanhas com problema

**Auditoria de links** lista os problemas por severidade, com a sugestão de correção.
- **Crítico:** URL inválida, parâmetro conflitante (o mesmo `utm_*` com valores diferentes na URL e nos parâmetros) ou macro que a Meta não vai trocar, como `%7B%7Bcampaign.name%7D%7D` ou `{{campaign_name}}`.
- **Atenção:** parâmetro obrigatório ausente, vazio ou repetido; anúncios da mesma campanha com `utm_campaign` fixo diferente.
- **Informativo:** valor diferente do padrão; sem empreendimento associado.

As severidades mudam em **Configurações**. Uma macro ainda não substituída, como `{{ad.name}}`, é o normal num anúncio no ar e não conta como defeito.

### Copiar e aplicar no Meta Ads

1. **Gerar:** em **Campanhas ativas**, abra o registro e clique em **Gerar os parâmetros do padrão**.
2. **Copiar:** clique em **Copiar parâmetros**. A cópia fica registrada, mas não quer dizer que foi aplicada.
3. **Colar no anúncio:** no Meta Ads, edite o anúncio, cole o texto em **Parâmetros de URL**, na parte de destino, e publique.
4. **Confirmar:** de volta à ferramenta, clique em **Marcar como aplicada no Meta Ads** e confirme. Ficam registrados a data e quem confirmou.
5. **Validar:** na próxima importação, se a Meta devolver o mesmo texto nos parâmetros, a etapa vira **Validada por nova importação**.

**Etapas:** UTM não gerada → gerada → parâmetros copiados → aplicação confirmada manualmente → validada por nova importação.

**Conflito na URL de destino:** se a URL já tiver UTM, a tela mostra o conflito, porque a Meta somaria os dois parâmetros. Tire a UTM da URL antes de aplicar.

**Link estático:** o modo estático (no registro e no **Gerador de UTMs**) monta um link com os valores conhecidos, para usar fora do Meta Ads, como bio ou WhatsApp.
- **Origem:** `{{site_source_name}}` não tem valor fora do clique, então a ferramenta pede a origem em vez de inventar.
- **UTM já na URL:** só entra depois da escolha entre manter e trocar.

### Exportar

**Onde:** em **Campanhas ativas** ou na **Auditoria**, escolha o recorte e clique em **Baixar CSV**.

**Recortes:**
- os da lista (com filtros);
- só os selecionados;
- todos os ativos elegíveis;
- só os com problema;
- só os com UTM válida.

**Formato:** o arquivo abre direto no Excel.
- **Separador:** `;`, com UTF-8 e BOM.
- **Proteção contra fórmula:** célula que começa com `=`, `+`, `-` ou `@` leva um apóstrofo na frente.

## Testes

```bash
npm test
```

**Os testes da ferramenta são `lib/utm-*.test.ts`:**
- **CSV:** vírgula, ponto e vírgula, aspas, quebra de linha, BOM, codificação, arquivo vazio e colunas repetidas.
- **Importação:**
  - cabeçalho desconhecido;
  - elegibilidade por nível e por veiculação;
  - ID corrompido pelo Excel;
  - duplicidades;
  - reimportação preservando os campos da equipe;
  - registros ausentes;
  - associação pela URL.
- **URL e gerador:** query string, fragmento, acentos, macros, conflitos e o modo estático.
- **Auditoria e exportação.**
- **Armazém:** os dados sobrevivem a uma nova instância, gravações simultâneas não se perdem, e um arquivo ilegível não é sobrescrito.
- **Proteção:** toda página e toda ação chamam `exigirGestor`.
- **Credenciais:** nenhuma credencial no código.

## Segunda fase: Meta Marketing API

A importação já trabalha com linhas no formato de `lib/utm/colunas.ts`. A API é só outra fonte dessas linhas (`FonteDeCampanhas`, em `lib/utm/meta-api.ts`). Prévia, auditoria e gravação continuam as mesmas, e o CSV continua funcionando.

1. **Criar o app:** criar um app na Meta for Developers ligado ao Business Manager da Lotus e pedir as permissões de leitura de anúncios (`ads_read`), com revisão do app se for exigida.
2. **Guardar o token:** gerar um token de **usuário do sistema** do Business Manager e guardá-lo **só no servidor**, em variável de ambiente sem `NEXT_PUBLIC_`. Nunca no navegador, no repositório ou no log.
3. **Ler as campanhas:** ler campanhas, conjuntos e anúncios com `effective_status` e status configurado, e o `url_tags` e o link do criativo. Fixar a versão da API e acompanhar o calendário de descontinuação.
4. **Respeitar os limites:** respeitar o limite de chamadas (cabeçalho `x-business-use-case-usage`) e registrar erros de API no histórico.
5. **Sincronizar:** só então trocar a situação "Não configurada" e oferecer a sincronização, que passa pela mesma prévia.

**O que nunca fazer:** raspar o Gerenciador de Anúncios ou pedir a senha pessoal de alguém na Meta.

## Limitações conhecidas

- **Formato da exportação:** os cabeçalhos reconhecidos cobrem a exportação da tabela e a de edição em massa, em português e em inglês. Um formato novo da Meta pode exigir mapeamento manual, e a tela permite.
- **Tamanho:** cada importação aceita até 3.000 linhas e cerca de 950 KB de dados mapeados, por causa do limite de 1 MB das Server Actions do Next. Arquivo maior deve ser importado em partes.
- **Confirmação da aplicação:** depende da pessoa. A validação automática só acontece se o CSV seguinte trouxer a coluna de parâmetros de URL.
- **Associação automática:** só acontece quando a URL de destino é exatamente a página de um empreendimento. O nome da campanha não é usado, para não associar errado.
- **Volume persistente:** sem `UTM_DATA_DIR` num volume, os dados se perdem a cada deploy.
