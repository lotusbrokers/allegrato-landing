/**
 * As seções fixas da Área do Corretor: as que vêm do cadastro da Dashboard
 * (lançamentos, terceiros, construtoras) e a lista pessoal de favoritos.
 *
 * Os materiais não estão aqui: as seções deles são as pastas que a equipe da
 * Lotus mantém no Google Drive (lib/area-do-corretor/drive.ts), e mudam quando
 * a pasta muda, sem tocar no código.
 */
import { ROTA_BASE } from './acesso';

export type IconeDaSecao = 'predio' | 'casa' | 'construtora' | 'estrela';

export type Secao = {
  chave: string;
  titulo: string;
  resumo: string;
  href: string;
  icone: IconeDaSecao;
  /** Palavras que a busca global associa à seção, sem acento. */
  palavras: string;
};

export const SECOES: Secao[] = [
  {
    chave: 'lancamentos',
    titulo: 'Lançamentos',
    resumo: 'Empreendimentos que a Lotus comercializa',
    href: `${ROTA_BASE}/lancamentos`,
    icone: 'predio',
    palavras: 'empreendimentos lancamentos na planta book tabela plantas memorial',
  },
  {
    chave: 'terceiros',
    titulo: 'Imóveis de terceiros',
    resumo: 'Imóveis à venda e para alugar',
    href: `${ROTA_BASE}/terceiros`,
    icone: 'casa',
    palavras: 'imoveis terceiros apartamentos casas terrenos comerciais venda aluguel',
  },
  {
    chave: 'construtoras',
    titulo: 'Construtoras',
    resumo: 'Parceiras e seus empreendimentos',
    href: `${ROTA_BASE}/construtoras`,
    icone: 'construtora',
    palavras: 'construtoras incorporadoras parceiras',
  },
  {
    chave: 'favoritos',
    titulo: 'Meus favoritos',
    resumo: 'O que você salvou',
    href: `${ROTA_BASE}/favoritos`,
    icone: 'estrela',
    palavras: 'favoritos salvos',
  },
];

/** A Dashboard (OctoDash). NEXT_PUBLIC_DASHBOARD_URL troca o endereço se ela ganhar domínio próprio. */
export const URL_DASHBOARD =
  process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim() || 'https://octodash-octo-dash.fltgo5.easypanel.host';

/** Webmail das contas @lotusbrokers.com.br (Locaweb), passado pela Lotus em 05/10/2026. */
export const URL_EMAIL_LOTUS = 'https://webmail-seguro.com.br/lotusbrokers.com.br/';

/**
 * Endereços do mapa dos lançamentos (Google My Maps, mantido pela Lotus), ou
 * null sem a variável MAPA_LANCAMENTOS_ID — aí a home da área não mostra a seção.
 *
 * O ID vem do ambiente, e não do código, pelo mesmo motivo da pasta do Drive: o
 * repositório é público, o mapa é compartilhado por link e os marcadores trazem
 * os links das pastas de cada empreendimento. Só o servidor lê a variável; o ID
 * chega apenas ao HTML de quem está logado.
 *
 * Aceita o ID puro ou o link inteiro do mapa (pega o `mid=`), e recusa qualquer
 * outra coisa para não montar URL de iframe com texto arbitrário.
 */
export function mapaDosLancamentos(valor = process.env.MAPA_LANCAMENTOS_ID): { embed: string; abrir: string } | null {
  const bruto = valor?.trim() ?? '';
  const id = bruto.match(/[?&]mid=([A-Za-z0-9_-]+)/)?.[1] ?? bruto;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) return null;
  return {
    embed: `https://www.google.com/maps/d/embed?mid=${id}`,
    abrir: `https://www.google.com/maps/d/viewer?mid=${id}`,
  };
}
