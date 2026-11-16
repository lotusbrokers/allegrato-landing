/**
 * Recortes da busca: páginas de /lotus-busca que já abrem filtradas, num
 * endereço próprio (/lotus-busca/<slug>), com título, H1 e descrição próprios.
 *
 * Pedido da Lotus em 04/11/2026: "casas em Jundiaí" e "casas em Itupeva", fora
 * do menu. Nenhum menu nem rodapé as linka; ficam no sitemap e, desde
 * 06/11/2026, nos guias de bairro da mesma cidade (ver recortesDaCidade): só com
 * o sitemap, o Google não tinha caminho até elas a partir da home. Recorte novo
 * entra nesta lista; a rota, o sitemap e os guias leem daqui.
 *
 * "Apartamentos em Jundiaí" entrou em 16/11/2026 (pedido da Lotus de páginas
 * por tipo), com 20 apartamentos à venda na cidade. Terrenos (1 em Jundiaí) e
 * casas em condomínio (nenhuma gravada com esse tipo) ficaram para quando
 * houver acervo: página quase vazia é o que o Google deixa fora do índice.
 *
 * "Imóveis em Jundiaí" entrou no mesmo dia, como subpágina de Comprar: todos os
 * imóveis à venda na cidade, de qualquer tipo. É o recorte sem lista de tipos
 * (ver paginaDaCidade), e o "Jundiaí" da trilha "Comprar › Jundiaí" da página
 * do imóvel leva até ele.
 *
 * O filtro é feito no servidor, antes de o componente receber a lista: o HTML
 * já sai só com as casas, e o visitante refina dali (quartos, faixa de preço,
 * texto). Os chips da busca não servem para o recorte porque o filtro de tipo
 * compara uma palavra só, e "casas" inclui o sobrado.
 *
 * Módulo puro (o import de lib/imoveis é só de tipo), para o teste importar.
 */
import type { ImovelBusca } from './imoveis';

export type RecorteDaBusca = {
  slug: string;
  /** H1 da página e começo do <title>. */
  titulo: string;
  descricao: string;
  cidade: string;
  /**
   * Tipos do cadastro que entram, comparados sem acento e sem caixa. Sem a
   * lista, entram todos os tipos: é a página da cidade inteira.
   */
  tipos?: readonly string[];
};

/** "Casas": a casa de rua, o sobrado e a casa em condomínio, com as grafias que o cadastro usa. */
const TIPOS_DE_CASA = ['Casa', 'Sobrado', 'Casa em condomínio', 'Casa de condomínio', 'Casa térrea'] as const;

// A ordem é a dos links nos guias de bairro: a página da cidade vem antes dos tipos.
export const RECORTES_DA_BUSCA: readonly RecorteDaBusca[] = [
  {
    slug: 'imoveis-em-jundiai',
    titulo: 'Imóveis à venda em Jundiaí',
    descricao:
      'Imóveis à venda em Jundiaí na vitrine da Lotus Brokers: apartamentos, casas e terrenos, com fotos, valores e atendimento de quem conhece o bairro.',
    cidade: 'Jundiaí',
  },
  {
    slug: 'casas-em-jundiai',
    titulo: 'Casas à venda em Jundiaí',
    descricao:
      'Casas e sobrados à venda em Jundiaí na vitrine da Lotus Brokers, com fotos, valores e atendimento de quem conhece o bairro.',
    cidade: 'Jundiaí',
    tipos: TIPOS_DE_CASA,
  },
  {
    slug: 'apartamentos-em-jundiai',
    titulo: 'Apartamentos à venda em Jundiaí',
    descricao:
      'Apartamentos à venda em Jundiaí na vitrine da Lotus Brokers, com fotos, valores e atendimento de quem conhece o bairro.',
    cidade: 'Jundiaí',
    tipos: ['Apartamento', 'Cobertura'],
  },
  {
    slug: 'casas-em-itupeva',
    titulo: 'Casas à venda em Itupeva',
    descricao:
      'Casas e sobrados à venda em Itupeva na vitrine da Lotus Brokers, com fotos, valores e atendimento de quem conhece o bairro.',
    cidade: 'Itupeva',
    tipos: TIPOS_DE_CASA,
  },
];

export function recorteDaBusca(slug: string): RecorteDaBusca | undefined {
  return RECORTES_DA_BUSCA.find((r) => r.slug === slug);
}

const normalizar = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Os recortes da cidade de um guia de bairro, na ordem da lista, comparando sem acento nem caixa. */
export function recortesDaCidade(cidade: string | null | undefined): RecorteDaBusca[] {
  if (!cidade?.trim()) return [];
  const alvo = normalizar(cidade);
  return RECORTES_DA_BUSCA.filter((r) => normalizar(r.cidade) === alvo);
}

/** A página com todos os imóveis à venda da cidade (o recorte sem lista de tipos), se houver. */
export function paginaDaCidade(cidade: string | null | undefined): RecorteDaBusca | undefined {
  return recortesDaCidade(cidade).find((r) => !r.tipos);
}

/** Os imóveis à venda do recorte: da mesma cidade e, quando há lista, do tipo; sem acento nem caixa. */
export function imoveisDoRecorte<T extends Pick<ImovelBusca, 'fin' | 'type' | 'city'>>(
  imoveis: readonly T[],
  recorte: RecorteDaBusca,
): T[] {
  const tipos = recorte.tipos ? new Set(recorte.tipos.map(normalizar)) : null;
  const cidade = normalizar(recorte.cidade);
  return imoveis.filter(
    (im) => im.fin === 'comprar' && (!tipos || tipos.has(normalizar(im.type))) && normalizar(im.city) === cidade,
  );
}
