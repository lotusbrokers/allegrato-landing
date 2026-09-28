import { supabase, TENANT_ID } from './supabase';

// Camada de dados dos CONDOMÍNIOS do Portal.
// Fonte: view pública portal_condominios (Supabase, leitura anônima, RLS por
// publicar_site=true). Usada pelas rotas dinâmicas /lotus-condominio/[id].

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
  tipo: string | null;
  status: string | null;
  status_comercial: string | null;
  construtora: string | null;
  incorporadora: string | null;
  ano_construcao: number | null;
  num_blocos_torres: number | null;
  descricao_site: string | null;
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

/**
 * Entra no índice quem tem o que mostrar: foto ou descrição.
 *
 * Mesmo critério de isListItemApresentavel em lib/lancamentos.ts, e pela mesma
 * razão: card vazio levando a página vazia é pior para quem procura do que o
 * condomínio não aparecer ainda. Publicada a foto ou a descrição no dashboard,
 * ele volta sozinho — não há lista para editar aqui.
 */
export function isCondominioApresentavel(c: CondominioCard): boolean {
  return Boolean(c.capa || c.resumo);
}

export function toCard(row: CondominioRow): CondominioCard {
  return {
    id: row.id,
    nome: row.nome,
    bairro: row.bairro,
    cidade: row.cidade,
    capa: capaUrl(row.fotos),
    resumo: resumoDe(row.descricao_site),
  };
}

const SELECT_FULL =
  'id, tenant_id, nome, codigo, bairro, cidade, estado, tipo, status, status_comercial, construtora, incorporadora, ano_construcao, num_blocos_torres, descricao_site, tour_virtual, metragens_disponiveis, fotos, ' +
  // infra_* usadas nos itens de lazer/estrutura da página
  'infra_piscina, infra_academia, infra_playground, infra_salao_festas, infra_churrasqueira, infra_quadra_poliesportiva, infra_portaria_24h, infra_espaco_gourmet, infra_brinquedoteca, infra_sauna_seca, infra_salao_jogos, infra_bicicletario, infra_espaco_pet, infra_wifi';

// Um condomínio por id (para a rota /lotus-condominio/[id]).
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

// Todos os ids publicados (para generateStaticParams — prerender das rotas).
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

// Cards resumidos (listagem / relacionados). Exclui opcionalmente um id.
export async function getCondominiosCards(excludeId?: string): Promise<CondominioCard[]> {
  const { data, error } = await supabase
    .from('portal_condominios')
    .select('id, nome, bairro, cidade, fotos, descricao_site')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getCondominiosCards] erro Supabase:', error.message);
    return [];
  }
  return (data as CondominioRow[])
    .filter((r) => r.id !== excludeId)
    .map(toCard);
}
