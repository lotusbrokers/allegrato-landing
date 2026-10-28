/**
 * O padrão de UTM da Lotus e as demais configurações do UTM Manager.
 *
 * O padrão inicial é o do briefing do projeto (28/10/2026). Tudo aqui pode ser
 * mudado em Configurações; a validação abaixo é a mesma para a tela e para o
 * servidor, que nunca grava o que chega sem passar por ela.
 */
import { VERIFICACOES, type CodigoDaVerificacao } from './auditoria';
import type { Configuracao, ParametroDoPadrao, Severidade } from './tipos';
import { problemasDeMacro } from './url';

export const PARAMETROS_PADRAO: ParametroDoPadrao[] = [
  { chave: 'utm_source', valor: '{{site_source_name}}', obrigatorio: true },
  { chave: 'utm_medium', valor: 'paid_social', obrigatorio: true },
  { chave: 'utm_campaign', valor: '{{campaign.name}}', obrigatorio: true },
  { chave: 'utm_content', valor: '{{ad.name}}', obrigatorio: true },
  { chave: 'utm_term', valor: '{{adset.name}}', obrigatorio: true },
];

/** IDs da Meta como parâmetros extras: o nome do anúncio pode repetir, o ID não. Desligados até alguém ligar. */
export const EXTRAS_DISPONIVEIS: ParametroDoPadrao[] = [
  { chave: 'campaign_id', valor: '{{campaign.id}}', obrigatorio: false },
  { chave: 'adset_id', valor: '{{adset.id}}', obrigatorio: false },
  { chave: 'ad_id', valor: '{{ad.id}}', obrigatorio: false },
];

export const CATEGORIAS_PADRAO = ['Lançamento', 'Imóvel pronto', 'Loteamento', 'Condomínio', 'Alto padrão', 'Minha Casa Minha Vida', 'Institucional'];

export function configuracaoPadrao(): Configuracao {
  return {
    parametros: PARAMETROS_PADRAO.map((p) => ({ ...p })),
    extras: [],
    categorias: [...CATEGORIAS_PADRAO],
    severidades: Object.fromEntries(Object.entries(VERIFICACOES).map(([codigo, v]) => [codigo, v.severidade])),
  };
}

/** Todos os parâmetros que o gerador escreve, na ordem: os principais e os extras ligados. */
export function parametrosDoPadrao(configuracao: Configuracao): ParametroDoPadrao[] {
  return [...configuracao.parametros, ...configuracao.extras];
}

const CHAVE_VALIDA = /^[a-z][a-z0-9_]{0,39}$/;
const SEVERIDADES: Severidade[] = ['critico', 'atencao', 'informativo'];

export type ConfiguracaoValidada = { ok: true; configuracao: Configuracao } | { ok: false; erros: string[] };

/**
 * Confere uma configuração vinda do formulário. Chave em minúsculas, sem
 * espaço; valor sem macro estragada; categoria sem repetição. Severidade só
 * das três conhecidas e para verificações que existem.
 */
export function validarConfiguracao(entrada: Configuracao): ConfiguracaoValidada {
  const erros: string[] = [];
  const todos = [...entrada.parametros, ...entrada.extras];
  const chaves = new Set<string>();
  for (const p of todos) {
    const chave = p.chave.trim();
    if (!CHAVE_VALIDA.test(chave)) erros.push(`Nome de parâmetro inválido: "${p.chave}". Use letras minúsculas, números e "_".`);
    if (chaves.has(chave)) erros.push(`Parâmetro repetido: ${chave}.`);
    chaves.add(chave);
    if (!p.valor.trim()) erros.push(`${chave} está sem valor.`);
    if (p.valor.length > 200) erros.push(`${chave}: valor com mais de 200 caracteres.`);
    for (const problema of problemasDeMacro(p.valor)) erros.push(`${chave}: ${problema}.`);
  }
  for (const obrigatorio of ['utm_source', 'utm_medium', 'utm_campaign']) {
    if (!entrada.parametros.some((p) => p.chave.trim() === obrigatorio)) erros.push(`O padrão precisa de ${obrigatorio}.`);
  }

  const categorias = [...new Set(entrada.categorias.map((c) => c.trim()).filter(Boolean))];
  if (categorias.length === 0) erros.push('Cadastre ao menos uma categoria.');
  if (categorias.some((c) => c.length > 60)) erros.push('Categoria com mais de 60 caracteres.');

  const severidades: Record<string, Severidade> = {};
  for (const codigo of Object.keys(VERIFICACOES) as CodigoDaVerificacao[]) {
    const valor = entrada.severidades[codigo] ?? VERIFICACOES[codigo].severidade;
    if (!SEVERIDADES.includes(valor)) erros.push(`Severidade inválida para ${codigo}.`);
    severidades[codigo] = valor;
  }

  if (erros.length) return { ok: false, erros };
  return {
    ok: true,
    configuracao: {
      parametros: entrada.parametros.map((p) => ({ chave: p.chave.trim(), valor: p.valor.trim(), obrigatorio: p.obrigatorio })),
      extras: entrada.extras.map((p) => ({ chave: p.chave.trim(), valor: p.valor.trim(), obrigatorio: false })),
      categorias,
      severidades,
    },
  };
}
