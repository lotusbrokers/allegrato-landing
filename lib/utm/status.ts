/**
 * Status de campanha, conjunto e anúncio, e quem entra na importação inicial.
 *
 * Ativo no Gerenciador de Anúncios é o liga e desliga de cada nível; estar no
 * ar é outra coisa. Um anúncio ligado num conjunto pausado não veicula, e um
 * anúncio ligado pode estar agendado ou em análise. Por isso a regra olha os
 * três níveis e a veiculação, quando o arquivo traz, e na dúvida não presume:
 * o registro vai para revisão.
 */
import type { DadosImportados, EstadoConfigurado, Nivel, Veiculacao } from './tipos';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CONFIGURADO: Record<string, EstadoConfigurado> = {
  active: 'ativo',
  ativo: 'ativo',
  ativa: 'ativo',
  on: 'ativo',
  ligado: 'ativo',
  ligada: 'ativo',
  paused: 'pausado',
  pausado: 'pausado',
  pausada: 'pausado',
  off: 'pausado',
  desligado: 'pausado',
  desligada: 'pausado',
  inactive: 'pausado',
  inativo: 'pausado',
  inativa: 'pausado',
  desativado: 'pausado',
  desativada: 'pausado',
  archived: 'arquivado',
  arquivado: 'arquivado',
  arquivada: 'arquivado',
  deleted: 'excluido',
  excluido: 'excluido',
  excluida: 'excluido',
};

/** null quando o campo veio vazio; "desconhecido" quando veio um texto que não está na lista. */
export function estadoConfigurado(valor: string | undefined): EstadoConfigurado | null {
  if (!valor?.trim()) return null;
  return CONFIGURADO[normalizar(valor)] ?? 'desconhecido';
}

const VEICULACAO: Record<string, Veiculacao> = {
  active: 'veiculando',
  ativo: 'veiculando',
  ativa: 'veiculando',
  veiculando: 'veiculando',
  'em veiculacao': 'veiculando',
  learning: 'veiculando',
  aprendizado: 'veiculando',
  'em aprendizado': 'veiculando',
  'learning limited': 'veiculando',
  'aprendizado limitado': 'veiculando',
  'not delivering': 'parado',
  'nao veiculando': 'parado',
  'nao esta sendo veiculado': 'parado',
  'nao esta sendo veiculada': 'parado',
  scheduled: 'parado',
  agendado: 'parado',
  agendada: 'parado',
  'in review': 'parado',
  'pending review': 'parado',
  'em analise': 'parado',
  'em revisao': 'parado',
  rejected: 'parado',
  rejeitado: 'parado',
  rejeitada: 'parado',
  'with issues': 'parado',
  'com problemas': 'parado',
  error: 'parado',
  erro: 'parado',
  'pending billing info': 'parado',
  'pagamento pendente': 'parado',
  processing: 'parado',
  processando: 'parado',
  inactive: 'desligado',
  inativo: 'desligado',
  inativa: 'desligado',
  off: 'desligado',
  paused: 'desligado',
  pausado: 'desligado',
  pausada: 'desligado',
  desativado: 'desligado',
  desativada: 'desligado',
  'campaign off': 'desligado',
  'ad set off': 'desligado',
  'adset off': 'desligado',
  'ad off': 'desligado',
  'campanha desativada': 'desligado',
  'conjunto de anuncios desativado': 'desligado',
  'anuncio desativado': 'desligado',
  completed: 'desligado',
  'recently completed': 'desligado',
  concluido: 'desligado',
  concluida: 'desligado',
  'concluido recentemente': 'desligado',
  archived: 'desligado',
  arquivado: 'desligado',
  arquivada: 'desligado',
  deleted: 'desligado',
  excluido: 'desligado',
  excluida: 'desligado',
};

export function lerVeiculacao(valor: string | undefined): Veiculacao | null {
  if (!valor?.trim()) return null;
  const texto = normalizar(valor);
  if (VEICULACAO[texto]) return VEICULACAO[texto];
  if (/\bdesativad|\boff\b|conclu/.test(texto)) return 'desligado';
  if (/nao (esta sendo )?veicul|agendad|analise/.test(texto)) return 'parado';
  return 'desconhecida';
}

export const ROTULO_DA_VEICULACAO: Record<Veiculacao, string> = {
  veiculando: 'Veiculando',
  parado: 'Ligado, sem veicular',
  desligado: 'Desligado',
  desconhecida: 'Não reconhecida',
};

/** O nível da linha: anúncio se tem ID de anúncio, conjunto se tem ID de conjunto, senão campanha. */
export function nivelDa(dados: DadosImportados): Nivel {
  if (dados.anuncioId) return 'anuncio';
  if (dados.conjuntoId) return 'conjunto';
  return 'campanha';
}

export type Elegibilidade = 'elegivel' | 'inelegivel' | 'revisao';

export type Avaliacao = { elegibilidade: Elegibilidade; motivos: string[] };

const NOME_DO_NIVEL: Record<Nivel, string> = { campanha: 'campanha', conjunto: 'conjunto de anúncios', anuncio: 'anúncio' };

/** "Campanha pausada", "Anúncio arquivado": o estado concorda com o nível. */
function estadoNoNivel(nivel: Nivel, estado: Exclude<EstadoConfigurado, 'ativo' | 'desconhecido'>): string {
  const feminino = nivel === 'campanha';
  const palavra = { pausado: 'pausad', arquivado: 'arquivad', excluido: 'excluíd' }[estado] + (feminino ? 'a' : 'o');
  const nome = NOME_DO_NIVEL[nivel];
  return `${nome[0].toUpperCase()}${nome.slice(1)} ${palavra}.`;
}

const NIVEIS_ATE: Record<Nivel, Nivel[]> = {
  campanha: ['campanha'],
  conjunto: ['campanha', 'conjunto'],
  anuncio: ['campanha', 'conjunto', 'anuncio'],
};

const CAMPO_DE_STATUS = { campanha: 'campanhaStatus', conjunto: 'conjuntoStatus', anuncio: 'anuncioStatus' } as const;

/**
 * Entra na importação inicial quem está ligado em todos os níveis acima dele
 * (um anúncio: campanha, conjunto e anúncio). Sem algum desses status, vale a
 * veiculação, que já resume os três; sem os dois, vai para revisão.
 */
export function avaliarElegibilidade(dados: DadosImportados): Avaliacao {
  const nivel = nivelDa(dados);
  const motivos: string[] = [];
  let faltaStatus = false;

  for (const n of NIVEIS_ATE[nivel]) {
    const estado = estadoConfigurado(dados[CAMPO_DE_STATUS[n]]);
    if (estado === null) {
      faltaStatus = true;
    } else if (estado === 'desconhecido') {
      return { elegibilidade: 'revisao', motivos: [`Status do ${NOME_DO_NIVEL[n]} não reconhecido: "${dados[CAMPO_DE_STATUS[n]]}".`] };
    } else if (estado !== 'ativo') {
      return { elegibilidade: 'inelegivel', motivos: [estadoNoNivel(n, estado)] };
    }
  }

  const veiculacao = lerVeiculacao(dados.veiculacao);
  if (veiculacao === 'desligado') return { elegibilidade: 'inelegivel', motivos: [`Veiculação: ${dados.veiculacao}.`] };

  if (!faltaStatus) {
    if (veiculacao === 'parado') motivos.push(`Ligado, mas sem veicular: ${dados.veiculacao}.`);
    if (veiculacao === null) motivos.push('Ligado nos três níveis; o arquivo não diz se está veiculando.');
    return { elegibilidade: 'elegivel', motivos };
  }
  if (veiculacao === 'veiculando' || veiculacao === 'parado') {
    motivos.push(`Ativo pela veiculação (${dados.veiculacao}); o arquivo não traz o status de todos os níveis.`);
    return { elegibilidade: 'elegivel', motivos };
  }
  if (veiculacao === 'desconhecida') return { elegibilidade: 'revisao', motivos: [`Veiculação não reconhecida: "${dados.veiculacao}".`] };
  const faltando = NIVEIS_ATE[nivel].filter((n) => estadoConfigurado(dados[CAMPO_DE_STATUS[n]]) === null).map((n) => NOME_DO_NIVEL[n]);
  return { elegibilidade: 'revisao', motivos: [`Sem o status de: ${faltando.join(', ')}. Não dá para afirmar que está ativo.`] };
}
