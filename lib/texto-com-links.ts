/**
 * Corpo do artigo preparado para desenhar, com os links já resolvidos.
 *
 * Dois tipos de link entram no texto:
 *  - o explícito, escrito no próprio texto como `[texto](endereço)`;
 *  - o automático: a primeira menção, no artigo, de um bairro que tem guia vira
 *    link para o guia. É o que liga o blog aos guias sem editar artigo por
 *    artigo. Até 16/10/2026 nenhum dos 26 artigos linkava um guia de bairro.
 *
 * Roda no servidor (a rota do artigo): o componente de cliente só desenha os
 * pedaços, sem regex nenhuma no navegador. Módulo puro, sem dependências, para
 * o teste importar direto.
 */
import type { BlocoArtigo, LinkArtigo } from './blog-posts';

/** Nome que vira link automático, na primeira vez que aparece no artigo. */
export type AlvoDeLink = { nome: string; href: string };

/** Pedaço de texto: texto puro ou um link. */
export type Pedaco = string | { texto: string; href: string };

/** Bloco pronto para desenhar. Parágrafo e itens já vêm em pedaços. */
export type BlocoPronto =
  | { paragrafo: Pedaco[] }
  | { titulo?: string; nivel?: 2 | 3; itens?: Pedaco[][]; links?: LinkArtigo[] };

const LINK_EXPLICITO = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Primeira menção (a mais à esquerda) de um alvo ainda não usado. Em empate de
 * posição vence o nome mais longo: "Jardim Bonfiglioli" antes de "Bonfiglioli".
 * O nome tem de estar inteiro: "Medeiros" não casa dentro de "Medeirosville".
 */
function comLinksAutomaticos(texto: string, alvos: readonly AlvoDeLink[], usados: Set<string>): Pedaco[] {
  let melhor: { inicio: number; fim: number; alvo: AlvoDeLink } | null = null;
  for (const alvo of alvos) {
    if (usados.has(alvo.href)) continue;
    const m = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapar(alvo.nome)})(?=$|[^\\p{L}\\p{N}])`, 'u').exec(texto);
    if (!m) continue;
    const inicio = m.index + m[1].length;
    const fim = inicio + m[2].length;
    if (!melhor || inicio < melhor.inicio || (inicio === melhor.inicio && fim > melhor.fim)) melhor = { inicio, fim, alvo };
  }
  if (!melhor) return texto ? [texto] : [];
  usados.add(melhor.alvo.href);
  const antes = texto.slice(0, melhor.inicio);
  return [
    ...(antes ? [antes] : []),
    { texto: texto.slice(melhor.inicio, melhor.fim), href: melhor.alvo.href },
    ...comLinksAutomaticos(texto.slice(melhor.fim), alvos, usados),
  ];
}

/** Um texto em pedaços: links explícitos primeiro, automáticos no que sobra. */
export function pedacosDoTexto(texto: string, alvos: readonly AlvoDeLink[] = [], usados: Set<string> = new Set()): Pedaco[] {
  const pedacos: Pedaco[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(LINK_EXPLICITO)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) pedacos.push(...comLinksAutomaticos(texto.slice(ultimo, inicio), alvos, usados));
    pedacos.push({ texto: m[1], href: m[2] });
    ultimo = inicio + m[0].length;
  }
  if (ultimo < texto.length) pedacos.push(...comLinksAutomaticos(texto.slice(ultimo), alvos, usados));
  return pedacos;
}

/**
 * O corpo inteiro em blocos prontos. Cada alvo vira link uma vez por artigo
 * (o primeiro parágrafo ou item que o cita); título de seção não ganha link.
 * Blocos de imóveis devem chegar aqui já resolvidos em `links`.
 */
export function prepararCorpo(corpo: readonly BlocoArtigo[], alvos: readonly AlvoDeLink[] = []): BlocoPronto[] {
  const usados = new Set<string>();
  return corpo.map((bloco) =>
    typeof bloco === 'string'
      ? { paragrafo: pedacosDoTexto(bloco, alvos, usados) }
      : {
          titulo: bloco.titulo,
          nivel: bloco.nivel,
          itens: bloco.itens?.map((item) => pedacosDoTexto(item, alvos, usados)),
          links: bloco.links,
        },
  );
}
