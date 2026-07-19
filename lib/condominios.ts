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
};

export function toCard(row: CondominioRow): CondominioCard {
  return {
    id: row.id,
    nome: row.nome,
    bairro: row.bairro,
    cidade: row.cidade,
    capa: capaUrl(row.fotos),
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
    .select('id, nome, bairro, cidade, fotos')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getCondominiosCards] erro Supabase:', error.message);
    return [];
  }
  return (data as CondominioRow[])
    .filter((r) => r.id !== excludeId)
    .map(toCard);
}
