/**
 * Recortes da busca: páginas de /lotus-busca que já abrem filtradas, num
 * endereço próprio (/lotus-busca/<slug>), com título, H1 e descrição próprios.
 *
 * Pedido da Lotus em 04/11/2026: "casas em Jundiaí" e "casas em Itupeva", fora
 * do menu. Nenhum menu nem rodapé as linka; ficam no sitemap e, desde
 * 06/11/2026, nos guias de bairro da mesma cidade (ver recorteDaCidade): só com
 * o sitemap, o Google não tinha caminho até elas a partir da home. Recorte novo
 * entra nesta lista; a rota, o sitemap e os guias leem daqui.
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
  /** Tipos do cadastro que entram, comparados sem acento e sem caixa. */
  tipos: readonly string[];
};

/** "Casas": a casa de rua, o sobrado e a casa em condomínio, com as grafias que o cadastro usa. */
const TIPOS_DE_CASA = ['Casa', 'Sobrado', 'Casa em condomínio', 'Casa de condomínio', 'Casa térrea'] as const;

export const RECORTES_DA_BUSCA: readonly RecorteDaBusca[] = [
  {
    slug: 'casas-em-jundiai',
    titulo: 'Casas à venda em Jundiaí',
    descricao:
      'Casas e sobrados à venda em Jundiaí na vitrine da Lotus Brokers, com fotos, valores e atendimento de quem conhece o bairro.',
    cidade: 'Jundiaí',
    tipos: TIPOS_DE_CASA,
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

/** O recorte da cidade de um guia de bairro, comparando sem acento nem caixa; undefined se a cidade não tem. */
export function recorteDaCidade(cidade: string | null | undefined): RecorteDaBusca | undefined {
  if (!cidade?.trim()) return undefined;
  const alvo = normalizar(cidade);
  return RECORTES_DA_BUSCA.find((r) => normalizar(r.cidade) === alvo);
}

/** Os imóveis à venda do recorte: tipo na lista e a mesma cidade, sem acento nem caixa. */
export function imoveisDoRecorte<T extends Pick<ImovelBusca, 'fin' | 'type' | 'city'>>(
  imoveis: readonly T[],
  recorte: RecorteDaBusca,
): T[] {
  const tipos = new Set(recorte.tipos.map(normalizar));
  const cidade = normalizar(recorte.cidade);
  return imoveis.filter((im) => im.fin === 'comprar' && tipos.has(normalizar(im.type)) && normalizar(im.city) === cidade);
}
