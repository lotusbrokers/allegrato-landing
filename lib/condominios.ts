import { supabase, TENANT_ID } from './supabase';

// Camada de dados dos CONDOMÍNIOS do Portal.
// Fonte: view pública portal_condominios (Supabase, leitura anônima, RLS por
// publicar_site=true). Usada pelas rotas dinâmicas /lotus-condominio/[slug].

export type FotoCondominio = { id?: string; url: string; legenda?: string; isCapa?: boolean };

// Só os campos que a página exibe (a view tem ~100 colunas infra_*; trazemos as
// principais + as infra_ como um mapa flexível para os itens de lazer/estrutura).
export type CondominioRow = {
  id: string;
  tenant_id: string;
  nome: string;
  codigo: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  /**
   * Endereço de rua. Existe na view desde sempre e não era lido — é o que faz o
   * mapa da página cravar o ponto em vez de procurar pelo nome do condomínio.
   * 47 dos 49 cadastros têm os três preenchidos.
   */
  logradouro: string | null;
  numero: string | null;
  cep: string | null;
  tipo: string | null;
  status: string | null;
  status_comercial: string | null;
  construtora: string | null;
  incorporadora: string | null;
  ano_construcao: number | null;
  num_blocos_torres: number | null;
  descricao_site: string | null;
  /** Carimbo do dashboard. Vira o lastmod da página no sitemap. */
  updated_at: string | null;
  tour_virtual: string | null;
  metragens_disponiveis: number[] | null;
  fotos: FotoCondominio[] | null;
  // infra_* vêm como colunas boolean/int; o fetch as agrega num objeto.
  [key: `infra_${string}`]: boolean | number | null;
};

function capaUrl(fotos: FotoCondominio[] | null): string | null {
  if (!fotos || fotos.length === 0) return null;
  return (fotos.find((f) => f.isCapa) ?? fotos[0]).url ?? null;
}

// View de card resumido (para a listagem e os "relacionados").
export type CondominioCard = {
  id: string;
  /** Pedaço final da URL: /lotus-condominio/<slug>. Ver slugCondominio. */
  slug: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
  capa: string | null;
  /**
   * Primeira frase de descricao_site, para o card do índice.
   *
   * Serve a duas coisas: dá ao card uma linha de contexto além do bairro, e é
   * metade do teste de isCondominioApresentavel — cadastro sem foto E sem
   * descrição não tem o que mostrar numa página.
   */
  resumo: string | null;
  /**
   * Rua, número, cidade e CEP preenchidos no dashboard.
   *
   * Booleano e não o endereço inteiro: o card não mostra endereço, só precisa
   * saber se o condomínio tem o que a PÁGINA dele precisa para funcionar.
   */
  enderecoCompleto: boolean;
  /**
   * Data real da última alteração no dashboard (updated_at), em ISO.
   *
   * Só o sitemap usa. Existe porque o lastmod anterior era a hora de gerar o
   * arquivo — igual para todas as páginas e mudando sozinho a cada revalidação,
   * que é exatamente o padrão que faz o Google parar de confiar no campo.
   */
  atualizadoEm: string | null;
};

/**
 * Primeira frase útil da descrição, curta o bastante para caber no card.
 *
 * Corta na fronteira de palavra e só reticencia quando de fato sobrou texto —
 * "…" num texto que terminou sozinho é ruído.
 */
function resumoDe(descricao: string | null, limite = 150): string | null {
  const limpo = (descricao ?? '').replace(/\s+/g, ' ').trim();
  if (!limpo) return null;
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return (ultimoEspaco > 60 ? corte.slice(0, ultimoEspaco) : corte).trimEnd() + '…';
}

/** Campo preenchido de verdade: nem null, nem string de espaços. */
function preenchido(v: string | null | undefined): boolean {
  return Boolean(v && String(v).trim());
}

/**
 * Entra na vitrine quem tem FOTO e ENDEREÇO COMPLETO.
 *
 * Os dois pilares da página do condomínio. Sem foto, o card é um bloco de
 * gradiente na fileira e a galeria não existe. Sem rua e número, o mapa não
 * crava o ponto e mostra o centro do município — o que é pior do que não
 * mostrar mapa nenhum, porque parece preciso e não é.
 *
 * Dos 49 cadastros de 28/09/2026, 44 passam. Preenchido o que falta no
 * dashboard, o condomínio volta sozinho: não há lista para editar aqui.
 */
export function isCondominioApresentavel(c: CondominioCard): boolean {
  return Boolean(c.capa) && c.enderecoCompleto;
}

/**
 * Slug do condomínio, derivado do nome.
 *
 * Derivado e não guardado: a view não tem coluna de slug, e criar uma seria uma
 * segunda fonte da verdade para divergir do nome. Nome corrigido no dashboard,
 * URL acompanha.
 *
 * Os 49 cadastros de hoje geram 49 slugs distintos — conferido antes de trocar
 * as URLs. Se um dia dois condomínios colidirem, resolveSlug devolve o primeiro
 * em ordem alfabética de id, de forma estável, e o outro fica inalcançável por
 * slug: o sinal disso é o segundo sumir da listagem com a URL do primeiro.
 * Nesse dia, desempatar aqui (sufixo de bairro é o caminho natural).
 */
export function slugCondominio(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toCard(row: CondominioRow): CondominioCard {
  return {
    id: row.id,
    slug: slugCondominio(row.nome),
    nome: row.nome,
    bairro: row.bairro,
    cidade: row.cidade,
    capa: capaUrl(row.fotos),
    resumo: resumoDe(row.descricao_site),
    enderecoCompleto:
      preenchido(row.logradouro) &&
      preenchido(row.numero) &&
      preenchido(row.cidade) &&
      preenchido(row.cep),
    atualizadoEm: row.updated_at ?? null,
  };
}

const SELECT_FULL =
  'id, tenant_id, nome, codigo, bairro, cidade, estado, logradouro, numero, cep, tipo, status, status_comercial, construtora, incorporadora, ano_construcao, num_blocos_torres, descricao_site, tour_virtual, metragens_disponiveis, fotos, ' +
  // infra_* usadas nos itens de lazer/estrutura da página
  'infra_piscina, infra_academia, infra_playground, infra_salao_festas, infra_churrasqueira, infra_quadra_poliesportiva, infra_portaria_24h, infra_espaco_gourmet, infra_brinquedoteca, infra_sauna_seca, infra_salao_jogos, infra_bicicletario, infra_espaco_pet, infra_wifi';

// Um condomínio por id. A rota entra por slug e chega aqui via getCondominioPorSlug;
// o UUID antigo da URL também cai direto aqui antes de redirecionar.
export async function getCondominio(id: string): Promise<CondominioRow | null> {
  const { data, error } = await supabase
    .from('portal_condominios')
    .select(SELECT_FULL)
    .eq('tenant_id', TENANT_ID)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getCondominio] erro Supabase:', error.message);
    return null;
  }
  return (data as unknown as CondominioRow) ?? null;
}

// Todos os ids publicados. Continua aqui porque é a consulta mais barata para
// saber se HÁ condomínio publicado; quem precisa de endereço usa getCondominioSlugs.
export async function getCondominioIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('portal_condominios')
    .select('id')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getCondominioIds] erro Supabase:', error.message);
    return [];
  }
  return (data as { id: string }[]).map((r) => r.id);
}

/**
 * id + slug de cada condomínio publicado — para o sitemap e para resolver a URL.
 *
 * Consulta leve de propósito (duas colunas): quem chama quer o endereço, não a
 * ficha. A ficha vem depois, por id, com getCondominio.
 */
export async function getCondominioSlugs(): Promise<{ id: string; slug: string }[]> {
  const { data, error } = await supabase
    .from('portal_condominios')
    .select('id, nome')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getCondominioSlugs] erro Supabase:', error.message);
    return [];
  }
  return (data as { id: string; nome: string }[])
    .map((r) => ({ id: r.id, slug: slugCondominio(r.nome) }))
    // Ordem estável por id: com slugs iguais, o vencedor é sempre o mesmo entre
    // requisições, em vez de depender da ordem que o banco devolveu.
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Um condomínio pelo slug da URL.
 *
 * Duas consultas de propósito: a primeira é leve (id + nome de todos) e só
 * serve para achar o id; a segunda traz a ficha completa daquele um. Puxar
 * SELECT_FULL de todos — são ~100 colunas infra_* — para depois descartar 48
 * seria muito mais caro do que o par de idas.
 */
export async function getCondominioPorSlug(slug: string): Promise<CondominioRow | null> {
  const alvo = (await getCondominioSlugs()).find((c) => c.slug === slug);
  return alvo ? getCondominio(alvo.id) : null;
}

// Cards resumidos (listagem / relacionados). Exclui opcionalmente um id.
export async function getCondominiosCards(excludeId?: string): Promise<CondominioCard[]> {
  const { data, error } = await supabase
    .from('portal_condominios')
    .select('id, nome, bairro, cidade, logradouro, numero, cep, fotos, descricao_site, updated_at')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getCondominiosCards] erro Supabase:', error.message);
    return [];
  }
  return (data as CondominioRow[])
    .filter((r) => r.id !== excludeId)
    .map(toCard);
}
