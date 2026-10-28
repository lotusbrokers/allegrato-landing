/**
 * O que as páginas do UTM Manager leem: o estado guardado, os empreendimentos
 * (catálogo do site somado aos cadastrados aqui) e a auditoria de todos os
 * registros. Só para o servidor.
 */
import { dataHora } from '@/lib/utm/formato';
import { catalogo } from '@/lib/area-do-corretor/dados';
import type { Corretor } from '@/lib/area-do-corretor/sessao';
import { armazem } from './armazem';
import { auditarTodos, rastreamentoDo, type Problema, type Rastreamento } from './auditoria';
import { listarConstrutoras, listarEmpreendimentos, type ItemDoCatalogo } from './empreendimentos';
import { avaliarElegibilidade, lerVeiculacao, ROTULO_DA_VEICULACAO } from './status';
import type { Empreendimento, EstadoDaAplicacao, EstadoUtm, Registro, Usuario } from './tipos';

export const ROTA_UTM = '/area-do-gestor/utm';

/** Origem das páginas do site, para montar a URL oficial de cada empreendimento. */
export const ORIGEM_DO_SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lotusbrokers.com.br').replace(/\/+$/, '');

/** No histórico vai só id e nome de quem fez: o e-mail não precisa ficar guardado. */
export function usuarioDe(corretor: Corretor): Usuario {
  return { id: corretor.id, nome: corretor.nome };
}

/**
 * Lançamentos com página no site, do mesmo cadastro que a Área do Corretor
 * lê. Se o banco não responder, a lista vem vazia e a página avisa: os
 * empreendimentos manuais e os registros continuam funcionando.
 */
export async function catalogoDoSite(): Promise<{ itens: ItemDoCatalogo[]; falhou: boolean }> {
  try {
    const { lancamentos } = await catalogo();
    return {
      itens: lancamentos.map((l) => ({ slug: l.id, nome: l.name, construtora: l.builder, caminho: l.href, bairro: l.neighborhood, cidade: l.city })),
      falhou: false,
    };
  } catch (e) {
    console.error('[utm] catálogo do site indisponível:', (e as Error).message);
    return { itens: [], falhou: true };
  }
}

export type Painel = {
  estado: EstadoUtm;
  registros: Registro[];
  empreendimentos: Empreendimento[];
  construtoras: string[];
  problemas: Map<string, Problema[]>;
  rastreamento: Map<string, Rastreamento>;
  catalogoFalhou: boolean;
};

export async function carregarPainel(): Promise<Painel> {
  const [estado, { itens, falhou }] = await Promise.all([armazem().ler(), catalogoDoSite()]);
  const registros = Object.values(estado.registros);
  const empreendimentos = listarEmpreendimentos(itens, estado.empreendimentos, ORIGEM_DO_SITE);
  const problemas = auditarTodos(registros, estado.configuracao);
  const rastreamento = new Map(registros.map((r) => [r.chave, rastreamentoDo(r, problemas.get(r.chave) ?? [])]));
  return {
    estado,
    registros,
    empreendimentos,
    construtoras: listarConstrutoras(empreendimentos, estado.construtoras),
    problemas,
    rastreamento,
    catalogoFalhou: falhou,
  };
}

/** Status em uma linha: ligado ou o motivo de não estar, e a veiculação quando o arquivo traz. */
export function statusDo(r: Registro): { texto: string; ativo: boolean } {
  const { elegibilidade, motivos } = avaliarElegibilidade(r.dados);
  const veiculacao = lerVeiculacao(r.dados.veiculacao);
  if (elegibilidade === 'elegivel') return { texto: veiculacao ? `Ativo · ${ROTULO_DA_VEICULACAO[veiculacao]}` : 'Ativo', ativo: true };
  if (elegibilidade === 'inelegivel') return { texto: motivos[0] ?? 'Desligado', ativo: false };
  return { texto: 'A revisar', ativo: false };
}

/** Uma linha da tabela de registros (components/utm/TabelaDeRegistros), já com os textos da tela. */
export type LinhaDaTabela = {
  chave: string;
  href: string;
  campanha: string;
  conjunto: string;
  anuncio: string;
  campanhaId: string;
  anuncioId: string;
  empreendimento: string | null;
  construtora: string;
  status: string;
  rastreamento: Rastreamento;
  etapa: EstadoDaAplicacao | undefined;
  ultimaImportacao: string;
  ausente: boolean;
};

export function linhasDaTabela(registros: Registro[], painel: Painel): LinhaDaTabela[] {
  const porId = new Map(painel.empreendimentos.map((e) => [e.id, e]));
  return registros.map((r) => {
    const empreendimento = r.associacao ? porId.get(r.associacao.empreendimentoId) : undefined;
    return {
      chave: r.chave,
      href: rotaDoRegistro(r.chave),
      campanha: r.dados.campanhaNome ?? '',
      conjunto: r.dados.conjuntoNome ?? '',
      anuncio: r.dados.anuncioNome ?? '',
      campanhaId: r.dados.campanhaId ?? '',
      anuncioId: r.dados.anuncioId ?? '',
      empreendimento: empreendimento?.nome ?? null,
      construtora: empreendimento?.construtora ?? '',
      status: statusDo(r).texto,
      rastreamento: painel.rastreamento.get(r.chave) ?? 'ausente',
      etapa: r.aplicacao?.estado,
      ultimaImportacao: dataHora(r.ultimaImportacao),
      ausente: r.ausenteNaUltimaImportacao,
    };
  });
}

/** Rótulo de um registro: o nome do próprio nível, com o da campanha quando ajuda. */
export function nomeDoRegistro(r: Registro): string {
  const d = r.dados;
  if (r.nivel === 'anuncio') return d.anuncioNome || `Anúncio ${d.anuncioId}`;
  if (r.nivel === 'conjunto') return d.conjuntoNome || `Conjunto ${d.conjuntoId}`;
  return d.campanhaNome || `Campanha ${d.campanhaId}`;
}

export function rotaDoRegistro(chave: string): string {
  return `${ROTA_UTM}/campanhas/${encodeURIComponent(chave)}`;
}
