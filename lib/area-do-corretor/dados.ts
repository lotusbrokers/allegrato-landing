/**
 * Catálogo da Área do Corretor: o mesmo cadastro que o site público mostra
 * (Dashboard → Supabase, leitura das views portal_*), visto do lado de quem vende.
 *
 * Fica guardado por 5 minutos e é o mesmo para todos os corretores: nada aqui é
 * pessoal. Favoritos e recentes vivem no navegador (memoria-local.ts).
 */
import { unstable_cache } from 'next/cache';
import { getLancamentosList, isListItemApresentavel, type LancamentoListItem } from '@/lib/lancamentos';
import { getImoveisBusca, oportunidadesDaSemana, type ImovelBusca } from '@/lib/imoveis';
import { agruparPorConstrutora, comCuradasSemLancamento, type Construtora } from '@/lib/construtoras-paginas';
import { curadasSemLancamento } from '@/lib/construtoras-conteudo';
import { slugify } from '@/lib/landings';
import { ROTA_BASE } from './acesso';
import type { ItemDeBusca } from './busca';
import { SECOES } from './secoes';

export type Catalogo = {
  lancamentos: LancamentoListItem[];
  imoveis: ImovelBusca[];
};

export const catalogo = unstable_cache(
  async (): Promise<Catalogo> => {
    const [lancamentos, imoveis] = await Promise.all([getLancamentosList(), getImoveisBusca()]);
    return { lancamentos: lancamentos.filter(isListItemApresentavel), imoveis };
  },
  ['area-do-corretor:catalogo'],
  { revalidate: 300 },
);

export function rotaDoLancamento(l: Pick<LancamentoListItem, 'name'>): string {
  return `${ROTA_BASE}/lancamentos/${slugify(l.name)}`;
}

export function rotaDoImovel(codigo: string): string {
  return `${ROTA_BASE}/terceiros/${encodeURIComponent(codigo)}`;
}

export function rotaDaConstrutora(slug: string): string {
  return `${ROTA_BASE}/construtoras/${slug}`;
}

export function lancamentoPorSlug(lancamentos: LancamentoListItem[], slug: string): LancamentoListItem | null {
  return lancamentos.find((l) => slugify(l.name) === slug) ?? null;
}

/** Mesma lista da página pública /construtoras, inclusive as curadas sem lançamento no banco. */
export function construtorasDoCatalogo(lancamentos: LancamentoListItem[]): Construtora<LancamentoListItem>[] {
  return comCuradasSemLancamento(agruparPorConstrutora(lancamentos), curadasSemLancamento());
}

/** Os tipos que existem no cadastro, do mais comum ao mais raro: são as pastas da vitrine de terceiros. */
export function tiposDeImovel(imoveis: ImovelBusca[]): { tipo: string; total: number }[] {
  const contagem = new Map<string, number>();
  for (const i of imoveis) contagem.set(i.type, (contagem.get(i.type) ?? 0) + 1);
  return [...contagem]
    .map(([tipo, total]) => ({ tipo, total }))
    .sort((a, b) => b.total - a.total || a.tipo.localeCompare(b.tipo, 'pt-BR'));
}

export type Destaque = {
  chave: string;
  titulo: string;
  detalhe: string;
  preco: string | null;
  img: string;
  selo: string;
  href: string;
};

/**
 * "Oportunidades em destaque" da home da área. Sem cadastro próprio: são os
 * selos que a equipe já marca na Dashboard — lançamentos exclusivos e os
 * imóveis exclusivos com destaque (a mesma regra das "Oportunidades da semana"
 * da home do site). Só entra quem tem foto.
 */
export function destaques({ lancamentos, imoveis }: Catalogo, limite = 6): Destaque[] {
  const deLancamentos: Destaque[] = lancamentos
    .filter((l) => l.exclusive && l.img)
    .slice(0, 3)
    .map((l) => ({
      chave: `lancamento:${l.id}`,
      titulo: l.name,
      detalhe: [l.neighborhood, l.city].filter(Boolean).join(' · '),
      preco: l.price,
      img: l.img!,
      selo: 'Lançamento exclusivo',
      href: rotaDoLancamento(l),
    }));
  const deImoveis: Destaque[] = oportunidadesDaSemana(imoveis, limite).map((i) => ({
    chave: `imovel:${i.codigo}`,
    titulo: `${i.type} · ${i.neighborhood}`,
    detalhe: [i.city, i.beds ? `${i.beds} dorm.` : '', i.area ? `${i.area} m²` : ''].filter(Boolean).join(' · '),
    preco: i.price || null,
    img: i.img,
    selo: i.destaque === 2 ? 'Super destaque' : i.destaque === 1 ? 'Destaque' : 'Exclusivo Lotus',
    href: rotaDoImovel(i.codigo),
  }));
  return [...deLancamentos, ...deImoveis].slice(0, limite);
}

/**
 * Índice da busca global. Ordem = relevância no empate: seções, lançamentos,
 * construtoras e, por último, os imóveis (os mais numerosos).
 */
export function indiceDeBusca({ lancamentos, imoveis }: Catalogo): ItemDeBusca[] {
  const juntar = (...partes: (string | number | null | undefined)[]) => partes.filter(Boolean).join(' · ');
  return [
    ...SECOES.map((s) => ({ tipo: 'secao' as const, titulo: s.titulo, detalhe: s.resumo, href: s.href, termos: s.palavras })),
    ...lancamentos.map((l) => ({
      tipo: 'lancamento' as const,
      titulo: l.name,
      detalhe: juntar(l.neighborhood, l.city, l.builder),
      href: rotaDoLancamento(l),
      termos: `${l.specs} ${l.stage} ${l.type} lancamento`,
    })),
    ...construtorasDoCatalogo(lancamentos).map((c) => ({
      tipo: 'construtora' as const,
      titulo: c.nome,
      detalhe: c.lancamentos.length === 1 ? '1 lançamento' : `${c.lancamentos.length} lançamentos`,
      href: rotaDaConstrutora(c.slug),
      // Quem busca um bairro também vê as construtoras com obra nele.
      termos: c.lancamentos.map((l) => `${l.name} ${l.neighborhood} ${l.city}`).join(' '),
    })),
    ...imoveis.map((i) => ({
      tipo: 'imovel' as const,
      titulo: `${i.type} · ${i.neighborhood}`,
      detalhe: juntar(i.city, i.price, `cód. ${i.codigo}`),
      href: rotaDoImovel(i.codigo),
      termos: `${i.codigo} ${i.beds ? `${i.beds} dormitorios` : ''} ${i.fin === 'alugar' ? 'aluguel locacao' : 'venda'} terceiros`,
    })),
  ];
}
