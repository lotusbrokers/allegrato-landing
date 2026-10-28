/**
 * Auditoria do rastreamento dos registros importados.
 *
 * Olha o que a Meta de fato usa: a URL de destino e os "Parâmetros de URL" do
 * anúncio, juntos. Macro dinâmica ({{ad.name}}) é o normal num anúncio ativo e
 * não é defeito; defeito é a macro estragada, que a Meta não troca.
 *
 * Cada verificação tem um código e uma severidade padrão, que a equipe muda em
 * Configurações sem mexer no código.
 */
import type { Configuracao, Registro, Severidade } from './tipos';
import { analisarUrl, lerParametros, problemasDeMacro, type ParametroDaUrl } from './url';

export const VERIFICACOES = {
  'url-ausente': { descricao: 'URL de destino ausente', severidade: 'atencao' },
  'url-invalida': { descricao: 'URL de destino malformada', severidade: 'critico' },
  'utm-ausente': { descricao: 'Parâmetro obrigatório do padrão ausente', severidade: 'atencao' },
  'utm-vazio': { descricao: 'Parâmetro presente, mas vazio', severidade: 'atencao' },
  'utm-duplicado': { descricao: 'Mesmo parâmetro repetido com o mesmo valor', severidade: 'atencao' },
  'utm-conflitante': { descricao: 'Mesmo parâmetro com valores diferentes (na URL e nos parâmetros, ou repetido)', severidade: 'critico' },
  'macro-corrompida': { descricao: 'Macro dinâmica que a Meta não vai substituir', severidade: 'critico' },
  'fora-do-padrao': { descricao: 'Valor diferente do padrão configurado', severidade: 'informativo' },
  'sem-empreendimento': { descricao: 'Sem empreendimento associado', severidade: 'informativo' },
  'campanha-inconsistente': { descricao: 'Anúncios da mesma campanha com utm_campaign diferentes', severidade: 'atencao' },
} as const satisfies Record<string, { descricao: string; severidade: Severidade }>;

export type CodigoDaVerificacao = keyof typeof VERIFICACOES;

export const ORDEM_DAS_SEVERIDADES: Severidade[] = ['critico', 'atencao', 'informativo'];

export const ROTULO_DA_SEVERIDADE: Record<Severidade, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  informativo: 'Informativo',
};

export type Problema = {
  codigo: CodigoDaVerificacao;
  severidade: Severidade;
  mensagem: string;
  /** Sugestão de correção, quando há uma. */
  sugestao?: string;
};

/** Parâmetros que o anúncio carrega: os da URL de destino e os do campo "Parâmetros de URL". */
export function parametrosEfetivos(registro: Registro): { daUrl: ParametroDaUrl[]; dosParametros: ParametroDaUrl[]; urlValida: boolean } {
  const analise = registro.dados.urlDestino ? analisarUrl(registro.dados.urlDestino) : null;
  return {
    daUrl: analise?.ok ? analise.url.parametros : [],
    dosParametros: lerParametros(registro.dados.parametrosUrl ?? ''),
    urlValida: Boolean(analise?.ok),
  };
}

/** A situação de rastreamento de um registro, para a tabela e os contadores. */
export type Rastreamento = 'valido' | 'critico' | 'atencao' | 'ausente';

/** Problemas de um registro. `campanhaInconsistente` vem de auditarTodos, que vê os irmãos. */
export function auditarRegistro(registro: Registro, configuracao: Configuracao, campanhaInconsistente = false): Problema[] {
  const problemas: Problema[] = [];
  const add = (codigo: CodigoDaVerificacao, mensagem: string, sugestao?: string) =>
    problemas.push({ codigo, severidade: configuracao.severidades[codigo] ?? VERIFICACOES[codigo].severidade, mensagem, sugestao });

  const url = registro.dados.urlDestino?.trim();
  if (!url) {
    add('url-ausente', 'O arquivo não traz a URL de destino deste registro.', 'Confira no Meta Ads se o anúncio leva a um site; anúncio de formulário ou de mensagem não tem.');
  } else {
    const analise = analisarUrl(url);
    if (!analise.ok) add('url-invalida', analise.erro, 'Corrija a URL de destino no Meta Ads.');
  }

  const { daUrl, dosParametros } = parametrosEfetivos(registro);
  const todos = [...daUrl, ...dosParametros];
  const porChave = new Map<string, ParametroDaUrl[]>();
  for (const p of todos) {
    const chave = p.chave.toLowerCase();
    porChave.set(chave, [...(porChave.get(chave) ?? []), p]);
  }

  for (const [chave, ocorrencias] of porChave) {
    if (!chave.startsWith('utm_')) continue;
    const valores = new Set(ocorrencias.map((o) => o.valor));
    if (ocorrencias.length > 1 && valores.size > 1) {
      add('utm-conflitante', `${chave} aparece com valores diferentes: ${[...valores].map((v) => `"${v}"`).join(' e ')}.`, 'Deixe o parâmetro só no campo "Parâmetros de URL" e tire-o da URL de destino.');
    } else if (ocorrencias.length > 1) {
      add('utm-duplicado', `${chave} aparece ${ocorrencias.length} vezes com o mesmo valor.`, 'Deixe uma ocorrência só.');
    }
    for (const o of ocorrencias) {
      if (o.valor.trim() === '') add('utm-vazio', `${chave} está vazio.`);
      for (const problema of problemasDeMacro(o.bruto)) add('macro-corrompida', `${chave}: ${problema}.`, 'Use as macros como a Meta documenta, por exemplo {{campaign.name}}, sem codificar as chaves.');
    }
  }

  for (const parametro of configuracao.parametros) {
    const chave = parametro.chave.toLowerCase();
    const ocorrencias = porChave.get(chave);
    if (!ocorrencias) {
      if (parametro.obrigatorio) add('utm-ausente', `Falta ${parametro.chave}.`, `Padrão: ${parametro.chave}=${parametro.valor}`);
      continue;
    }
    if (ocorrencias.length === 1 && ocorrencias[0].valor !== parametro.valor && ocorrencias[0].valor.trim() !== '') {
      add('fora-do-padrao', `${parametro.chave}="${ocorrencias[0].valor}"; o padrão é "${parametro.valor}".`);
    }
  }

  if (!registro.associacao) add('sem-empreendimento', 'Empreendimento não identificado.', 'Associe um empreendimento na página do registro.');
  if (campanhaInconsistente) add('campanha-inconsistente', 'Outros anúncios desta campanha usam outro utm_campaign.');
  return problemas;
}

/** utm_campaign fixo (sem macro) de um registro, para comparar irmãos da mesma campanha. */
function utmCampaignFixo(registro: Registro): string | null {
  const { daUrl, dosParametros } = parametrosEfetivos(registro);
  const valor = [...dosParametros, ...daUrl].find((p) => p.chave.toLowerCase() === 'utm_campaign')?.valor;
  return valor && !/\{\{/.test(valor) ? valor : null;
}

export function auditarTodos(registros: Registro[], configuracao: Configuracao): Map<string, Problema[]> {
  const fixosPorCampanha = new Map<string, Set<string>>();
  for (const r of registros) {
    const fixo = utmCampaignFixo(r);
    const campanha = r.dados.campanhaId;
    if (fixo && campanha) fixosPorCampanha.set(campanha, new Set([...(fixosPorCampanha.get(campanha) ?? []), fixo]));
  }
  const resultado = new Map<string, Problema[]>();
  for (const r of registros) {
    const inconsistente = Boolean(r.dados.campanhaId && (fixosPorCampanha.get(r.dados.campanhaId)?.size ?? 0) > 1 && utmCampaignFixo(r));
    resultado.set(r.chave, auditarRegistro(r, configuracao, inconsistente));
  }
  return resultado;
}

/**
 * Resumo para a tabela: crítico ou atenção se houver problema de rastreamento
 * dessa severidade, "ausente" se o anúncio não carrega nenhuma UTM. Problema
 * informativo não rebaixa um registro válido.
 */
export function rastreamentoDo(registro: Registro, problemas: Problema[]): Rastreamento {
  const { daUrl, dosParametros } = parametrosEfetivos(registro);
  const temUtm = [...daUrl, ...dosParametros].some((p) => p.chave.toLowerCase().startsWith('utm_'));
  if (problemas.some((p) => p.severidade === 'critico')) return 'critico';
  if (!temUtm) return 'ausente';
  if (problemas.some((p) => p.severidade === 'atencao')) return 'atencao';
  return 'valido';
}

export const ROTULO_DO_RASTREAMENTO: Record<Rastreamento, string> = {
  valido: 'UTM válida',
  critico: 'Problema crítico',
  atencao: 'Precisa de revisão',
  ausente: 'Sem UTM',
};
