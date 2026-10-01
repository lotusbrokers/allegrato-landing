import datas from './datas-de-alteracao.json';

/**
 * Datas de alteração das rotas estáticas, para o lastmod do sitemap.
 *
 * O JSON é gerado por scripts/datas-de-alteracao.mjs a partir do último commit
 * que tocou os arquivos-fonte de cada rota (ver o cabeçalho do script). Aqui só
 * se lê: nada neste módulo consulta o relógio, de propósito — "agora" foi
 * exatamente o bug que isto corrige.
 */

type Grupo = keyof typeof datas.grupos;

const rotas: Record<string, string> = datas.rotas;
const grupos: Record<string, string> = datas.grupos;

function paraData(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Data do último commit que alterou a rota; undefined quando não há registro. */
export function dataDaRota(rota: string): Date | undefined {
  return paraData(rotas[rota]);
}

/** Data de um grupo de páginas que compartilham a mesma fonte (bairros, construtoras). */
export function dataDoGrupo(grupo: Grupo): Date | undefined {
  return paraData(grupos[grupo]);
}

/**
 * A mais recente entre várias datas, ignorando o que for nulo ou inválido.
 * Serve para os índices: /lotus-blog mudou quando o artigo mais novo entrou,
 * mesmo que o arquivo do índice em si esteja igual há meses.
 */
export function maisRecente(...valores: (Date | string | null | undefined)[]): Date | undefined {
  let melhor: Date | undefined;
  for (const v of valores) {
    const d = v instanceof Date ? v : paraData(v ?? undefined);
    if (d && (!melhor || d > melhor)) melhor = d;
  }
  return melhor;
}
