/**
 * CORREÇÃO DE CADASTRO — exceção deliberada, e temporária, à regra "o banco manda".
 *
 * Preço, metragem, bairro e estágio dos cards de lançamento vêm do dashboard; o
 * portal só lê. Quando um cadastro fica defasado em relação à tabela oficial, o
 * lugar certo de corrigir é lá. Este mapa cobre o intervalo entre descobrir o
 * erro e o cadastro ser atualizado.
 *
 * Cada correção só vale ENQUANTO o banco ainda trouxer o valor antigo (`de`).
 * Atualizado o cadastro no dashboard, a linha deixa de casar e o banco volta a
 * mandar sozinho — a correção nunca mascara um valor mais novo. Depois disso a
 * linha pode (e deve) ser apagada daqui.
 *
 * Módulo sem dependências de propósito: a regra é testável sem Supabase.
 */

/** Campos do cadastro que um card exibe e que podem ser corrigidos. */
export type CamposCorrigiveis = {
  nome: string;
  preco_texto: string | null;
  preco_num: number | null;
  specs: string | null;
  bairro: string | null;
  estagio: string | null;
};

type Campo = keyof CamposCorrigiveis;

/** `de` = valor que o banco traz hoje (null = campo vazio). `para` = valor certo. */
export type Correcao = {
  [C in Campo]: { campo: C; de: CamposCorrigiveis[C]; para: NonNullable<CamposCorrigiveis[C]> };
}[Campo];

/**
 * Chave = slug da landing (o mesmo de hrefForSlug). O slug não muda quando o
 * nome é reescrito no dashboard — "Maxx Santa Ângela" segue sendo
 * maxx-santa-angela.
 *
 * Valores da tabela oficial da Santa Angela de setembro/2026, conferidos em
 * 29/09/2026 contra o que o dashboard publicava.
 */
export const CORRECOES_DE_CADASTRO: Record<string, Correcao[]> = {
  vigore: [
    { campo: 'preco_texto', de: 'a partir de R$ 397.896', para: 'a partir de R$ 410.191' },
    { campo: 'preco_num', de: 397896, para: 410191.2 },
  ],
  'portal-dos-lagos': [
    { campo: 'preco_texto', de: 'a partir de R$ 582.766', para: 'a partir de R$ 637.805' },
    { campo: 'preco_num', de: 582766, para: 637805.49 },
    // O cadastro está sem estágio; o loteamento está entregue.
    { campo: 'estagio', de: null, para: 'Entregue' },
  ],
  'resort-prime': [
    { campo: 'preco_texto', de: 'a partir de R$ 941.498', para: 'a partir de R$ 988.992' },
    { campo: 'preco_num', de: 941498, para: 988992.74 },
    // O cadastro descrevia lotes; o Resort Prime é de apartamentos.
    { campo: 'specs', de: 'Lotes a partir de 110 m²', para: '68–112 m² · 2 e 3 dorms' },
  ],
  'altos-da-avenida': [
    { campo: 'preco_texto', de: 'a partir de R$ 881.875', para: 'a partir de R$ 884.223' },
    { campo: 'preco_num', de: 881875, para: 884223.72 },
  ],
  allegrato: [
    { campo: 'preco_texto', de: 'a partir de R$ 358.182', para: 'a partir de R$ 365.345' },
    { campo: 'preco_num', de: 358182, para: 365345.98 },
  ],
  'maxx-santa-angela': [
    // O nome oficial é sem acento (como na landing). O slug não muda: slugify
    // já tirava o acento, e o lead continua casando pela linha crua do banco.
    { campo: 'nome', de: 'Maxx Santa Ângela', para: 'Maxx Santa Angela' },
    // O Maxx fica na Vila Galvão (Rua João Tonini, 400) e parte de 71 m².
    { campo: 'bairro', de: 'Horto Florestal', para: 'Vila Galvão' },
    { campo: 'specs', de: '51–98 m² · 2 e 3 dorms', para: '71–98 m² · 2 e 3 dorms' },
  ],
  // Tabela da Santa Angela válida a partir de 01/10/2026, enviada pela Lotus em
  // 05/10/2026: 32 lotes, o menor de 250 m² (quadra P) por R$ 461.734,74. A
  // metragem "a partir de 250 m²" continua certa.
  'reserva-castanheira': [
    { campo: 'preco_texto', de: 'a partir de R$ 460.582', para: 'a partir de R$ 461.734' },
    { campo: 'preco_num', de: 460582, para: 461734.74 },
  ],
};

const vazio = (v: unknown): boolean =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

/** O banco ainda traz o valor antigo? Vazio casa com vazio; texto ignora espaço nas pontas. */
function aindaDefasado(atual: unknown, de: unknown): boolean {
  if (vazio(atual) || vazio(de)) return vazio(atual) && vazio(de);
  if (typeof de === 'number') return Number(atual) === de;
  return String(atual).trim() === String(de).trim();
}

/**
 * Devolve o cadastro com as correções que ainda se aplicam. Não altera o
 * objeto recebido; sem correção aplicável, devolve o próprio objeto.
 */
export function corrigirCadastro<T extends CamposCorrigiveis>(
  row: T,
  slug: string | null | undefined,
  correcoes: Record<string, Correcao[]> = CORRECOES_DE_CADASTRO,
): T {
  const aplicaveis = (slug ? correcoes[slug] ?? [] : []).filter((c) => aindaDefasado(row[c.campo], c.de));
  if (aplicaveis.length === 0) return row;

  const corrigido: CamposCorrigiveis = {
    nome: row.nome,
    preco_texto: row.preco_texto,
    preco_num: row.preco_num,
    specs: row.specs,
    bairro: row.bairro,
    estagio: row.estagio,
  };
  for (const c of aplicaveis) Object.assign(corrigido, { [c.campo]: c.para });
  return { ...row, ...corrigido };
}
