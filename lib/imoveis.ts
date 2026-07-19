import { supabase, TENANT_ID } from './supabase';

// Camada de dados dos IMÓVEIS do Portal.
// Fonte: view pública portal_imoveis (Supabase, leitura anônima, RLS por
// status_aprovacao='aprovado'). Rotas dinâmicas /lotus-imovel/[codigo].
// Identificador da rota = codigo_imovel (ex "CA054") — URL amigável, único por tenant.

export type FotoImovel = { id?: string; url: string; legenda?: string; isCapa?: boolean };

export type ImovelRow = {
  id: string;
  tenant_id: string;
  codigo_imovel: string;
  titulo: string | null;
  tipo: string | null;
  tipo_simplificado: string | null;
  finalidade: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  area_total: number | null;
  area_util: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  salas: number | null;
  valor_venda: number | null;
  valor_locacao: number | null;
  valor_condominio: number | null;
  valor_iptu: number | null;
  descricao: string | null;
  fotos: FotoImovel[] | null;
  metragem_m2: number | null;
  condominio_id: string | null;
  link_video: string | null;
  tour_virtual: string | null;
};

function capaUrl(fotos: FotoImovel[] | null): string | null {
  if (!fotos || fotos.length === 0) return null;
  return (fotos.find((f) => f.isCapa) ?? fotos[0]).url ?? null;
}

export type ImovelCard = {
  codigo: string;
  titulo: string | null;
  bairro: string | null;
  cidade: string | null;
  capa: string | null;
  valor: number | null;
};

export function toCard(row: ImovelRow): ImovelCard {
  return {
    codigo: row.codigo_imovel,
    titulo: row.titulo,
    bairro: row.bairro,
    cidade: row.cidade,
    capa: capaUrl(row.fotos),
    valor: row.valor_venda || row.valor_locacao || null,
  };
}

// Formata valor em R$ (para a UI). null/0 -> "Consultar valor".
export function formatValor(v: number | null): string {
  if (!v || v <= 0) return 'Consultar valor';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

const SELECT_FULL =
  'id, tenant_id, codigo_imovel, titulo, tipo, tipo_simplificado, finalidade, logradouro, numero, bairro, cidade, estado, cep, area_total, area_util, quartos, suites, banheiros, vagas, salas, valor_venda, valor_locacao, valor_condominio, valor_iptu, descricao, fotos, metragem_m2, condominio_id, link_video, tour_virtual';

// Um imóvel por codigo_imovel (para a rota /lotus-imovel/[codigo]).
export async function getImovel(codigo: string): Promise<ImovelRow | null> {
  const { data, error } = await supabase
    .from('portal_imoveis')
    .select(SELECT_FULL)
    .eq('tenant_id', TENANT_ID)
    .eq('codigo_imovel', codigo)
    .maybeSingle();

  if (error) {
    console.error('[getImovel] erro Supabase:', error.message);
    return null;
  }
  return (data as unknown as ImovelRow) ?? null;
}

// Todos os códigos aprovados (para generateStaticParams).
export async function getImovelCodigos(): Promise<string[]> {
  const { data, error } = await supabase
    .from('portal_imoveis')
    .select('codigo_imovel')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getImovelCodigos] erro Supabase:', error.message);
    return [];
  }
  return (data as { codigo_imovel: string }[]).map((r) => r.codigo_imovel);
}

// Cards resumidos (relacionados / listagem). Exclui opcionalmente um código.
export async function getImoveisCards(excludeCodigo?: string): Promise<ImovelCard[]> {
  const { data, error } = await supabase
    .from('portal_imoveis')
    .select('id, tenant_id, codigo_imovel, titulo, bairro, cidade, fotos, valor_venda, valor_locacao')
    .eq('tenant_id', TENANT_ID);
  if (error) {
    console.error('[getImoveisCards] erro Supabase:', error.message);
    return [];
  }
  return (data as ImovelRow[])
    .filter((r) => r.codigo_imovel !== excludeCodigo)
    .map(toCard);
}
