/**
 * Exportação CSV dos registros do UTM Manager, para abrir no Excel ou no
 * Google Planilhas (ponto e vírgula, UTF-8 com BOM, célula protegida contra
 * fórmula: ver lib/utm/csv.ts).
 */
import { ROTULO_DA_SEVERIDADE, rastreamentoDo, ROTULO_DO_RASTREAMENTO, type Problema } from './auditoria';
import { escreverCsv } from './csv';
import { gerarDinamico } from './gerador';
import type { Configuracao, Empreendimento, Registro } from './tipos';
import { urlComParametrosDaMeta } from './url';

export type Recorte = 'todos' | 'problemas' | 'validos' | 'selecionados';

export const ROTULO_DO_RECORTE: Record<Recorte, string> = {
  todos: 'Todos os registros da lista',
  problemas: 'Só os com problema',
  validos: 'Só os com UTM válida',
  selecionados: 'Só os selecionados',
};

const CABECALHO = [
  'ID da conta',
  'ID da campanha',
  'ID do conjunto',
  'ID do anúncio',
  'Campanha',
  'Conjunto de anúncios',
  'Anúncio',
  'Status da campanha',
  'Status do conjunto',
  'Status do anúncio',
  'Veiculação',
  'Empreendimento',
  'Construtora',
  'URL de destino',
  'Parâmetros importados',
  'Modelo de parâmetros (padrão)',
  'URL montada pela Meta',
  'Resultado da auditoria',
  'Problemas',
  'Última importação',
  'Aplicação da UTM',
  'Última revisão',
];

const ROTULO_DA_APLICACAO = { gerada: 'Gerada', copiada: 'Copiada', confirmada: 'Aplicação confirmada manualmente', validada: 'Validada por nova importação' };

export function filtrarPorRecorte(registros: Registro[], problemas: Map<string, Problema[]>, recorte: Recorte, selecionados: Set<string>): Registro[] {
  return registros.filter((r) => {
    const rastreamento = rastreamentoDo(r, problemas.get(r.chave) ?? []);
    if (recorte === 'problemas') return rastreamento !== 'valido';
    if (recorte === 'validos') return rastreamento === 'valido';
    if (recorte === 'selecionados') return selecionados.has(r.chave);
    return true;
  });
}

export function exportarCsv(registros: Registro[], problemas: Map<string, Problema[]>, empreendimentos: Empreendimento[], configuracao: Configuracao): string {
  const porId = new Map(empreendimentos.map((e) => [e.id, e]));
  const linhas = registros.map((r) => {
    const d = r.dados;
    const empreendimento = r.associacao ? porId.get(r.associacao.empreendimentoId) : undefined;
    const dosProblemas = problemas.get(r.chave) ?? [];
    const modelo = gerarDinamico(configuracao, d.urlDestino);
    return [
      d.contaId ?? '',
      d.campanhaId ?? '',
      d.conjuntoId ?? '',
      d.anuncioId ?? '',
      d.campanhaNome ?? '',
      d.conjuntoNome ?? '',
      d.anuncioNome ?? '',
      d.campanhaStatus ?? '',
      d.conjuntoStatus ?? '',
      d.anuncioStatus ?? '',
      d.veiculacao ?? '',
      empreendimento?.nome ?? 'Empreendimento não identificado',
      empreendimento?.construtora ?? '',
      d.urlDestino ?? '',
      d.parametrosUrl ?? '',
      modelo.parametros,
      d.urlDestino && d.parametrosUrl ? urlComParametrosDaMeta(d.urlDestino, d.parametrosUrl) : '',
      ROTULO_DO_RASTREAMENTO[rastreamentoDo(r, dosProblemas)],
      dosProblemas.map((p) => `${ROTULO_DA_SEVERIDADE[p.severidade]}: ${p.mensagem}`).join(' | '),
      r.ultimaImportacao,
      r.aplicacao ? ROTULO_DA_APLICACAO[r.aplicacao.estado] : 'UTM não gerada',
      r.aplicacao && r.aplicacao.estado !== 'gerada' ? r.aplicacao.quando : '',
    ];
  });
  return escreverCsv([CABECALHO, ...linhas]);
}
