/**
 * Montagem e conferência de URL com UTM, sem depender da interface.
 *
 * Três cuidados que o URLSearchParams não tem, e por isso a query string é
 * tratada à mão:
 *  - Macro dinâmica da Meta ({{campaign.name}}) fica como está. Codificada
 *    (%7B%7B...) a Meta não a reconhece e o texto da macro iria cru para o
 *    relatório.
 *  - Parâmetro que já estava na URL é mantido como veio, inclusive a
 *    codificação e a ordem: um parâmetro comercial (gclid, id do corretor) não
 *    pode sumir nem mudar.
 *  - UTM nova que bate com uma diferente já presente vira conflito para a
 *    pessoa decidir. Nada é sobrescrito em silêncio.
 */

/** As macros que a Meta substitui em "Parâmetros de URL" (documentação de parâmetros dinâmicos). */
export const MACROS_DA_META = [
  'site_source_name',
  'placement',
  'campaign.id',
  'campaign.name',
  'adset.id',
  'adset.name',
  'ad.id',
  'ad.name',
] as const;

export type Macro = (typeof MACROS_DA_META)[number];

const MACRO = /\{\{\s*([^{}]*?)\s*\}\}/g;

export type ParametroDaUrl = {
  chave: string;
  /** Valor decodificado, para comparar e exibir. */
  valor: string;
  /** Como estava escrito na URL; é o que volta na URL montada. */
  bruto: string;
};

export type UrlAnalisada = {
  /** Esquema, host e caminho, sem query nem fragmento. */
  base: string;
  parametros: ParametroDaUrl[];
  /** Com o "#", ou vazio. */
  fragmento: string;
};

function decodificar(texto: string): string {
  try {
    return decodeURIComponent(texto.replace(/\+/g, ' '));
  } catch {
    return texto;
  }
}

/** Parâmetros de uma query string ("a=1&b=2", com ou sem "?"), na ordem e sem decodificar o bruto. */
export function lerParametros(query: string): ParametroDaUrl[] {
  return query
    .replace(/^\?/, '')
    .split('&')
    .filter((par) => par !== '')
    .map((par) => {
      const igual = par.indexOf('=');
      const chaveBruta = igual >= 0 ? par.slice(0, igual) : par;
      const valorBruto = igual >= 0 ? par.slice(igual + 1) : '';
      return { chave: decodificar(chaveBruta).trim(), valor: decodificar(valorBruto), bruto: par };
    });
}

export type ResultadoDaAnalise = { ok: true; url: UrlAnalisada } | { ok: false; erro: string };

/**
 * Confere a URL de destino. Só http e https: um "javascript:" ou "data:" num
 * link de campanha é erro ou ataque, nunca destino.
 */
export function analisarUrl(endereco: string): ResultadoDaAnalise {
  const texto = (endereco ?? '').trim();
  if (!texto) return { ok: false, erro: 'URL de destino ausente.' };
  if (/\s/.test(texto)) return { ok: false, erro: 'A URL tem espaço em branco no meio.' };
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return { ok: false, erro: 'Não é uma URL válida (falta https:// ou o endereço está incompleto).' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, erro: `Esquema não aceito em link de campanha: ${url.protocol}` };
  if (!url.hostname.includes('.')) return { ok: false, erro: 'O endereço não tem um domínio completo.' };

  // A query e o fragmento saem do texto original: o URL() recodifica o que lê.
  const semFragmento = texto.split('#')[0];
  const fragmento = texto.includes('#') ? texto.slice(texto.indexOf('#')) : '';
  const interrogacao = semFragmento.indexOf('?');
  const base = interrogacao >= 0 ? semFragmento.slice(0, interrogacao) : semFragmento;
  const query = interrogacao >= 0 ? semFragmento.slice(interrogacao + 1) : '';
  return { ok: true, url: { base, parametros: lerParametros(query), fragmento } };
}

/** Macros citadas num valor, com o nome como escrito. */
export function macrosDo(valor: string): string[] {
  return [...valor.matchAll(MACRO)].map((m) => m[1]);
}

export function macroConhecida(nome: string): nome is Macro {
  return (MACROS_DA_META as readonly string[]).includes(nome);
}

/**
 * Sinais de macro estragada: chave codificada (%7B%7B), chave sem par ou
 * nome que a Meta não conhece. Em qualquer um deles a Meta manda o texto como
 * veio, e o relatório recebe "{{campaign_name}}" no lugar do nome.
 */
export function problemasDeMacro(valor: string): string[] {
  const problemas: string[] = [];
  if (/%7b%7b|%7d%7d/i.test(valor)) problemas.push('macro codificada (%7B%7B): a Meta não a substitui');
  const semMacros = valor.replace(MACRO, '');
  if (/\{\{|\}\}|\{|\}/.test(semMacros)) problemas.push('chave de macro sem par');
  for (const nome of macrosDo(valor)) if (!macroConhecida(nome)) problemas.push(`macro desconhecida: {{${nome}}}`);
  return problemas;
}

/** Codifica o texto fixo e deixa as macros como estão. */
export function codificarValor(valor: string): string {
  let saida = '';
  let ultimo = 0;
  for (const m of valor.matchAll(MACRO)) {
    saida += encodeURIComponent(valor.slice(ultimo, m.index)) + `{{${m[1]}}}`;
    ultimo = (m.index ?? 0) + m[0].length;
  }
  return saida + encodeURIComponent(valor.slice(ultimo));
}

export type ParametroNovo = { chave: string; valor: string };

/** Texto para o campo "Parâmetros de URL" do Meta Ads: "utm_source=...&utm_medium=...". */
export function textoDosParametros(parametros: ParametroNovo[]): string {
  return parametros.map((p) => `${encodeURIComponent(p.chave)}=${codificarValor(p.valor)}`).join('&');
}

export type Conflito = { chave: string; atual: string; novo: string };

export type UrlMontada = {
  url: string;
  /** Mesma chave já na URL com outro valor. Só entram na URL se a pessoa escolheu substituir. */
  conflitos: Conflito[];
  /** Mesma chave e mesmo valor: não repete. */
  jaPresentes: string[];
};

/**
 * Junta os parâmetros à URL de destino, mantendo o que já estava lá e o
 * fragmento no fim. Conflito só é resolvido se a chave estiver em `substituir`;
 * senão o valor antigo fica e o conflito volta para a tela.
 */
export function montarUrl(destino: UrlAnalisada, novos: ParametroNovo[], substituir: string[] = []): UrlMontada {
  const conflitos: Conflito[] = [];
  const jaPresentes: string[] = [];
  const pares = destino.parametros.map((p) => p.bruto);
  const indiceDe = (chave: string) => destino.parametros.findIndex((p) => p.chave.toLowerCase() === chave.toLowerCase());

  for (const novo of novos) {
    const bruto = `${encodeURIComponent(novo.chave)}=${codificarValor(novo.valor)}`;
    const i = indiceDe(novo.chave);
    if (i < 0) {
      pares.push(bruto);
    } else if (destino.parametros[i].valor === novo.valor) {
      jaPresentes.push(novo.chave);
    } else if (substituir.includes(novo.chave)) {
      pares[i] = bruto;
    } else {
      conflitos.push({ chave: novo.chave, atual: destino.parametros[i].valor, novo: novo.valor });
    }
  }
  const query = pares.length ? `?${pares.join('&')}` : '';
  return { url: `${destino.base}${query}${destino.fragmento}`, conflitos, jaPresentes };
}

/**
 * Como a Meta monta o link do anúncio: a URL de destino com os "Parâmetros de
 * URL" no fim, separados por "?" ou "&". É a prévia do modo dinâmico; as
 * macros só viram valor no clique.
 */
export function urlComParametrosDaMeta(destino: string, parametros: string): string {
  if (!parametros) return destino;
  const [semFragmento, ...resto] = destino.split('#');
  const fragmento = resto.length ? `#${resto.join('#')}` : '';
  const separador = semFragmento.includes('?') ? (/[?&]$/.test(semFragmento) ? '' : '&') : '?';
  return `${semFragmento}${separador}${parametros}${fragmento}`;
}

/** Valores conhecidos de um registro, para trocar macro por texto no link estático. */
export type ValoresConhecidos = Partial<Record<Macro, string>>;

/**
 * Troca as macros por valores conhecidos (modo estático). A que não tem valor
 * fica de fora da troca e volta em `semValor`: inventar "facebook" para
 * {{site_source_name}} daria um link que mente sobre a origem.
 */
export function resolverMacros(valor: string, conhecidos: ValoresConhecidos): { valor: string; semValor: string[] } {
  const semValor: string[] = [];
  const resolvido = valor.replace(MACRO, (inteiro, nome: string) => {
    const conhecido = macroConhecida(nome) ? conhecidos[nome]?.trim() : undefined;
    if (conhecido) return conhecido;
    semValor.push(nome);
    return inteiro;
  });
  return { valor: resolvido, semValor };
}
