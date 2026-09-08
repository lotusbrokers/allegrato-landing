/**
 * As construtoras como página: /construtoras e /construtoras/[slug].
 *
 * DE ONDE VÊM OS DADOS. Não existe cadastro de construtora no dashboard — o
 * portal lê cinco views do Supabase (portal_lancamentos, portal_imoveis,
 * portal_condominios, portal_brokers, portal_landing_slugs) e nenhuma delas é
 * de construtoras. O que existe é o campo de texto livre `construtora` em cada
 * lançamento.
 *
 * A consequência é direta e vale registrar aqui, porque muda o que a página
 * pode mostrar: dá para montar o nome e a lista de empreendimentos dela, que é
 * a relação pedida, e não dá para montar história, descrição institucional,
 * tempo de atuação nem galeria de fotos — esses campos não existem em lugar
 * nenhum. Inventar texto para preencher a seção seria pior do que não ter a
 * seção: o site passaria a afirmar coisas sobre empresas parceiras.
 *
 * Quando o dashboard ganhar esses campos, o caminho é acrescentá-los ao tipo
 * `Construtora` abaixo e renderizar as seções condicionalmente, do mesmo jeito
 * que a capa já é condicional.
 *
 * A CAPA. Sem foto própria da construtora, o card usa a capa de um dos
 * empreendimentos dela — a primeira que existir. É imagem real e relacionada,
 * não ilustração genérica, e a legenda na página diz de qual empreendimento ela
 * é, para não passar por foto institucional.
 *
 * Módulo puro, sem o client do Supabase, para o teste importar sem arrastar o
 * banco — mesma razão de lib/landings.ts e lib/construtoras.ts.
 */

import { slugify } from './landings';
import { mapaDeConstrutoras } from './construtoras';

/** O mínimo que um lançamento precisa expor para virar item de construtora. */
export type LancamentoDaConstrutora = {
  name: string;
  builder: string;
  img: string | null;
};

export type Construtora<T extends LancamentoDaConstrutora> = {
  /** Nome canônico, já sem as variações de grafia do dashboard. */
  nome: string;
  /** Slug da URL, derivado do nome canônico. */
  slug: string;
  /** Empreendimentos dela, na ordem em que chegaram da listagem. */
  lancamentos: T[];
  /** Capa emprestada de um empreendimento, com o nome dele para a legenda. */
  capa: { img: string; empreendimento: string } | null;
};

/**
 * Agrupa os lançamentos por construtora canônica.
 *
 * Quem não tem construtora informada — ou tem um preenchimento genérico, que
 * `mapaDeConstrutoras` já descarta — fica de fora: não existe página para uma
 * construtora sem nome.
 *
 * A ordem é alfabética pelo nome, a mesma da listagem de lançamentos.
 */
export function agruparPorConstrutora<T extends LancamentoDaConstrutora>(
  lancamentos: readonly T[]
): Construtora<T>[] {
  const canonico = mapaDeConstrutoras(lancamentos.map((l) => l.builder));
  const porNome = new Map<string, T[]>();

  for (const l of lancamentos) {
    const nome = canonico.get((l.builder ?? '').trim());
    if (!nome) continue;
    if (!porNome.has(nome)) porNome.set(nome, []);
    porNome.get(nome)!.push(l);
  }

  return [...porNome.entries()]
    .map(([nome, itens]) => {
      const comFoto = itens.find((i) => i.img);
      return {
        nome,
        slug: slugify(nome),
        lancamentos: itens,
        capa: comFoto ? { img: comFoto.img as string, empreendimento: comFoto.name } : null,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** A construtora de um slug, ou null se não houver. */
export function construtoraPorSlug<T extends LancamentoDaConstrutora>(
  construtoras: readonly Construtora<T>[],
  slug: string
): Construtora<T> | null {
  return construtoras.find((c) => c.slug === slug) ?? null;
}
