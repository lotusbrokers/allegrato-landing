/**
 * Busca por quartos, metragem e valor nas listas da área: lançamentos e
 * imóveis de terceiros.
 *
 * Lançamentos: o cadastro da Dashboard não tem campo numérico de metragem nem de quartos: o
 * `tipo_dorms` está vazio em todos, e o que existe é o texto livre de
 * especificações ("55–64 m² · 2 dorms", "157–203 m² · 3 e 4 suítes", "Lotes de
 * 420 a 908 m²", "43,78 m² a 46,14"). Daí a leitura do texto aqui. Valor é o
 * `priceNum`, o "a partir de" do cadastro — o preço da unidade mais barata.
 *
 * Imóveis de terceiros: o cadastro já traz quartos, área e valor como número
 * (ver toBusca em lib/imoveis.ts), e o valor buscado é o de venda.
 *
 * Quem não tem o dado não passa no filtro dele (e a página diz quantos ficaram
 * de fora por isso), mesma regra de lib/filtros-lancamentos.ts no site
 * público: deixar passar faria o corretor achar que viu o recorte que pediu.
 *
 * Módulo puro, sem banco, para o teste importar direto.
 */

/** Menor e maior valor encontrados no texto ("55–64 m²" → 55 a 64). */
export type Faixa = { min: number; max: number };

export type Medidas = { area: Faixa | null; quartos: Faixa | null };

// "2 dorms", "2 e 3 dorms", "2 ou 3 dormitórios", "3 e 4 suítes", "4 quartos".
// Em "2 dorms com suíte" só o 2 conta: "suíte" sem número antes não casa.
const QUARTOS = /(\d+(?:\s*(?:,|e|ou|a)\s*\d+)*)\s*(?:dorms?\b|dormit[oó]rios?|quartos?|su[ií]tes?)/gi;
const VAGAS = /\d+\s*vagas?/gi;
// "m²" e "m2": sem tirar, o "2" de "m2" viraria número.
const UNIDADE = /m\s*[²2](?!\d)/gi;
const NUMERO = /\d+(?:[.,]\d+)?/g;

/** Número escrito em pt-BR: "43,78" → 43.78; "1.200" (milhar) → 1200. */
function numeroBr(texto: string): number {
  if (/^\d{1,3}(?:\.\d{3})+$/.test(texto)) return Number(texto.replace(/\./g, ''));
  return Number(texto.replace(',', '.'));
}

function faixa(valores: number[]): Faixa | null {
  return valores.length ? { min: Math.min(...valores), max: Math.max(...valores) } : null;
}

/**
 * Metragem e quartos de um lançamento, lidos do texto do cadastro. Primeiro
 * saem os quartos e as vagas, para os números deles não serem lidos como m²;
 * o que sobra entre 10 e 100.000 é metragem (lote incluído).
 */
export function medidasDoLancamento(...textos: string[]): Medidas {
  const quartos: number[] = [];
  const resto = textos
    .join(' · ')
    .replace(QUARTOS, (_trecho, lista: string) => {
      quartos.push(...(lista.match(/\d+/g) ?? []).map(Number));
      return ' ';
    })
    .replace(VAGAS, ' ')
    .replace(UNIDADE, ' ');
  const areas = (resto.match(NUMERO) ?? []).map(numeroBr).filter((n) => n >= 10 && n <= 100_000);
  return { area: faixa(areas), quartos: faixa(quartos.filter((n) => n >= 1 && n <= 10)) };
}

/* ---------------- Filtros ---------------- */

/** As opções de cada seletor. Valor de URL fora delas é ignorado. */
export const OPCOES_QUARTOS = [1, 2, 3, 4] as const;
export const OPCOES_METRAGEM = [50, 70, 90, 120, 150, 200] as const;
export const OPCOES_VALOR = [400_000, 600_000, 800_000, 1_000_000, 1_500_000, 2_000_000] as const;

export type FiltrosDaBusca = {
  /** Pelo menos N quartos (no lançamento, em alguma tipologia). */
  quartos: number | null;
  /** Pelo menos N m² (no lançamento, em alguma unidade ou lote). */
  m2: number | null;
  /** Até R$ N (no lançamento, a unidade mais barata; no imóvel, o valor de venda). */
  valor: number | null;
};

function opcao(valor: string | undefined, opcoes: readonly number[]): number | null {
  const n = Number(valor);
  return opcoes.includes(n) ? n : null;
}

/** Filtros a partir da URL (?quartos=3&m2=90&valor=800000). */
export function lerFiltros(params: { quartos?: string; m2?: string; valor?: string }): FiltrosDaBusca {
  return {
    quartos: opcao(params.quartos, OPCOES_QUARTOS),
    m2: opcao(params.m2, OPCOES_METRAGEM),
    valor: opcao(params.valor, OPCOES_VALOR),
  };
}

export function temFiltro(f: FiltrosDaBusca): boolean {
  return f.quartos !== null || f.m2 !== null || f.valor !== null;
}

/** O mínimo que o filtro precisa de cada lançamento. */
export type ItemComMedidas = { type: string; specs: string; priceNum: number };

/**
 * Os itens que passam em todos os filtros (combinação E), na ordem recebida, e
 * quantos ficaram de fora só por não terem no cadastro algum dado filtrado.
 */
export function filtrarLancamentos<T extends ItemComMedidas>(
  itens: readonly T[],
  f: FiltrosDaBusca,
): { itens: T[]; semDado: number } {
  const resultado: T[] = [];
  let semDado = 0;
  for (const item of itens) {
    const { area, quartos } = medidasDoLancamento(item.type, item.specs);
    const temPreco = item.priceNum > 0;
    const faltaDado = (f.quartos !== null && !quartos) || (f.m2 !== null && !area) || (f.valor !== null && !temPreco);
    if (faltaDado) {
      semDado++;
      continue;
    }
    const passa =
      (f.quartos === null || (quartos !== null && quartos.max >= f.quartos)) &&
      (f.m2 === null || (area !== null && area.max >= f.m2)) &&
      (f.valor === null || item.priceNum <= f.valor);
    if (passa) resultado.push(item);
  }
  return { itens: resultado, semDado };
}

/** O mínimo que o filtro precisa de cada imóvel de terceiros. */
export type ImovelComMedidas = { beds: number; area: number; priceNum: number; fin: 'comprar' | 'alugar' };

/**
 * Mesma regra de filtrarLancamentos, com os números do cadastro. Aluguel não
 * entra numa busca por valor de venda: fica de fora e é contado como sem o dado.
 */
export function filtrarImoveis<T extends ImovelComMedidas>(itens: readonly T[], f: FiltrosDaBusca): { itens: T[]; semDado: number } {
  const resultado: T[] = [];
  let semDado = 0;
  for (const item of itens) {
    const faltaDado =
      (f.quartos !== null && !(item.beds > 0)) ||
      (f.m2 !== null && !(item.area > 0)) ||
      (f.valor !== null && !(item.fin === 'comprar' && item.priceNum > 0));
    if (faltaDado) {
      semDado++;
      continue;
    }
    const passa =
      (f.quartos === null || item.beds >= f.quartos) &&
      (f.m2 === null || item.area >= f.m2) &&
      (f.valor === null || item.priceNum <= f.valor);
    if (passa) resultado.push(item);
  }
  return { itens: resultado, semDado };
}

/**
 * "800 mil", "1 milhão", "1,5 milhão", "2 milhões" — sem "R$": no seletor o
 * rótulo do campo já diz que é valor, e o texto curto cabe no celular.
 */
export function rotuloDeValor(valor: number): string {
  if (valor < 1_000_000) return `${valor / 1000} mil`;
  const milhoes = valor / 1_000_000;
  return `${String(milhoes).replace('.', ',')} ${milhoes >= 2 ? 'milhões' : 'milhão'}`;
}
