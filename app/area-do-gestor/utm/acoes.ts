'use server';

/**
 * Ações do UTM Manager. Toda ação começa por exigirGestor(): a checagem do
 * papel é aqui, no servidor, e não no botão escondido da tela. O Next confere
 * a origem de cada chamada de Server Action (proteção contra CSRF), e o que
 * chega é tratado como entrada externa: validado de novo, com limite de
 * tamanho. Erro interno vai para o log do servidor; a tela recebe uma frase.
 */
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { armazem, registrarEvento } from '@/lib/utm/armazem';
import { VERIFICACOES } from '@/lib/utm/auditoria';
import { EXTRAS_DISPONIVEIS, PARAMETROS_PADRAO, validarConfiguracao } from '@/lib/utm/configuracao';
import { empreendimentoPelaUrl, idDoSite, listarEmpreendimentos, validarEmpreendimento } from '@/lib/utm/empreendimentos';
import { exportarCsv, filtrarPorRecorte } from '@/lib/utm/exportar';
import { plural } from '@/lib/utm/formato';
import { gerarDinamico } from '@/lib/utm/gerador';
import { aplicarImportacao, MAXIMO_DE_LINHAS, prepararImportacao, validarLinhas, type Previa } from '@/lib/utm/importacao';
import { carregarPainel, catalogoDoSite, ORIGEM_DO_SITE, ROTA_UTM, usuarioDe } from '@/lib/utm/painel';
import { avaliarElegibilidade } from '@/lib/utm/status';
import type { Aplicacao, Configuracao, EmpreendimentoGuardado, EstadoDaAplicacao, Lote, Severidade } from '@/lib/utm/tipos';

export type EstadoDoFormulario = { ok: boolean; erro: string | null; mensagem: string | null };

/** Erro de validação: a mensagem é para a pessoa ver. Qualquer outro erro vira a frase genérica. */
class Recusa extends Error {}

function falha(e: unknown, contexto: string): { ok: false; erro: string } {
  if (e instanceof Recusa) return { ok: false, erro: e.message };
  console.error(`[utm] ${contexto}:`, (e as Error).message);
  return { ok: false, erro: 'Não foi possível concluir agora. Nada foi alterado; tente de novo em instantes.' };
}

function campo(dados: FormData, nome: string, limite: number, rotulo: string): string {
  const valor = String(dados.get(nome) ?? '').trim();
  if (valor.length > limite) throw new Recusa(`${rotulo} com mais de ${limite} caracteres.`);
  return valor;
}

function nomeDoArquivo(valor: unknown): string {
  const limpo = typeof valor === 'string' ? valor.replace(/[^\p{L}\p{N} ._()-]/gu, '').trim().slice(0, 120) : '';
  return limpo || 'arquivo.csv';
}

function revalidar() {
  revalidatePath(ROTA_UTM, 'layout');
}

// ---------------------------------------------------------------- importação

export async function previaDaImportacao(entrada: { linhas: unknown }): Promise<{ ok: true; previa: Previa } | { ok: false; erro: string }> {
  await exigirGestor();
  const validacao = validarLinhas(entrada?.linhas);
  if (!validacao.ok) return validacao;
  try {
    const estado = await armazem().ler();
    return { ok: true, previa: prepararImportacao(validacao.linhas, estado.registros) };
  } catch (e) {
    return falha(e, 'prévia da importação');
  }
}

export async function confirmarImportacao(entrada: { arquivo: unknown; linhas: unknown; escolhidos: unknown }): Promise<{ ok: true; lote: Lote } | { ok: false; erro: string }> {
  const gestor = await exigirGestor();
  const validacao = validarLinhas(entrada?.linhas);
  if (!validacao.ok) return validacao;
  const escolhidos = entrada.escolhidos;
  if (!Array.isArray(escolhidos) || escolhidos.length > MAXIMO_DE_LINHAS || !escolhidos.every((c) => typeof c === 'string')) {
    return { ok: false, erro: 'Seleção inválida.' };
  }
  const { itens } = await catalogoDoSite();
  const usuario = usuarioDe(gestor);
  const quando = new Date().toISOString();
  const arquivo = nomeDoArquivo(entrada.arquivo);
  try {
    const lote = await armazem().alterar((estado) => {
      const empreendimentos = listarEmpreendimentos(itens, estado.empreendimentos, ORIGEM_DO_SITE);
      // A prévia é refeita com o estado deste momento: entre a prévia na tela
      // e o clique, outra pessoa pode ter importado o mesmo arquivo.
      const previa = prepararImportacao(validacao.linhas, estado.registros);
      const novo = aplicarImportacao(estado, previa, new Set(escolhidos as string[]), {
        quando,
        usuario,
        arquivo,
        loteId: randomUUID(),
        empreendimentoDaUrl: (url) => empreendimentoPelaUrl(url, empreendimentos),
      });
      const c = novo.contagens;
      const partes = [
        `${plural(c.importados, 'importado', 'importados')} (${c.novos} novos, ${c.atualizados} atualizados)`,
        c.validados > 0 && plural(c.validados, 'UTM validada', 'UTMs validadas'),
        c.desligados > 0 && `${plural(c.desligados, 'já cadastrado agora desligado', 'já cadastrados agora desligados')}`,
        `${plural(c.ignorados, 'ignorado', 'ignorados')} de ${c.encontrados}`,
      ].filter(Boolean);
      registrarEvento(estado, 'importacao', usuario, novo.id, `${arquivo}: ${partes.join(', ')}.`, quando);
      return novo;
    });
    revalidar();
    return { ok: true, lote };
  } catch (e) {
    return falha(e, 'importação');
  }
}

// ---------------------------------------------------------------- registro

export async function salvarRegistro(_anterior: EstadoDoFormulario, dados: FormData): Promise<EstadoDoFormulario> {
  const gestor = await exigirGestor();
  try {
    const chave = campo(dados, 'chave', 80, 'Registro');
    const empreendimentoId = campo(dados, 'empreendimento', 200, 'Empreendimento');
    const observacoes = campo(dados, 'observacoes', 1000, 'Observações');
    const { itens } = await catalogoDoSite();
    const usuario = usuarioDe(gestor);
    await armazem().alterar((estado) => {
      const registro = estado.registros[chave];
      if (!registro) throw new Recusa('Registro não encontrado.');
      const empreendimentos = listarEmpreendimentos(itens, estado.empreendimentos, ORIGEM_DO_SITE);
      const escolhido = empreendimentos.find((e) => e.id === empreendimentoId);
      if (empreendimentoId && !escolhido) throw new Recusa('Empreendimento não encontrado.');

      if ((registro.associacao?.empreendimentoId ?? '') !== empreendimentoId) {
        registro.associacao = escolhido ? { empreendimentoId, origem: 'manual' } : null;
        registrarEvento(estado, 'associacao', usuario, chave, escolhido ? `Associado a ${escolhido.nome}.` : 'Associação removida.');
      } else if (registro.associacao) {
        // Confirmar a sugestão da URL também é escolha da equipe: a importação não a troca mais.
        registro.associacao = { ...registro.associacao, origem: 'manual' };
      }
      if (registro.observacoes !== observacoes) {
        registro.observacoes = observacoes;
        registrarEvento(estado, 'atualizacao', usuario, chave, 'Observações atualizadas.');
      }
    });
    revalidar();
    return { ok: true, erro: null, mensagem: 'Salvo.' };
  } catch (e) {
    return { ...falha(e, 'salvar registro'), mensagem: null };
  }
}

const RESUMO_DA_ETAPA: Record<Exclude<EstadoDaAplicacao, 'validada'>, string> = {
  gerada: 'Parâmetros gerados pelo padrão.',
  copiada: 'Parâmetros copiados (ainda não quer dizer aplicados no Meta Ads).',
  confirmada: 'Aplicação no Meta Ads confirmada manualmente.',
};

/**
 * Avança a UTM de um registro: gerada, copiada, confirmada. O texto dos
 * parâmetros é sempre o do padrão atual, calculado aqui; o da tela não é
 * aceito. Confirmar exige que aquele texto tenha sido gerado ou copiado antes.
 */
export async function registrarEtapa(entrada: { chave: unknown; etapa: unknown }): Promise<{ ok: true; aplicacao: Aplicacao } | { ok: false; erro: string }> {
  const gestor = await exigirGestor();
  const chave = typeof entrada?.chave === 'string' ? entrada.chave : '';
  const etapa = entrada?.etapa;
  if (etapa !== 'gerada' && etapa !== 'copiada' && etapa !== 'confirmada') return { ok: false, erro: 'Etapa inválida.' };
  const usuario = usuarioDe(gestor);
  try {
    const aplicacao = await armazem().alterar((estado) => {
      const registro = estado.registros[chave];
      if (!registro) throw new Recusa('Registro não encontrado.');
      const parametros = gerarDinamico(estado.configuracao, registro.dados.urlDestino).parametros;
      const atual = registro.aplicacao;
      const mesmoTexto = atual?.parametros === parametros;
      const quando = new Date().toISOString();

      if (etapa === 'confirmada') {
        if (!atual || !mesmoTexto) throw new Recusa('Gere e copie os parâmetros do padrão atual antes de confirmar.');
        if (atual.estado === 'validada' || atual.estado === 'confirmada') return atual;
      } else if (mesmoTexto && atual && (atual.estado === 'confirmada' || atual.estado === 'validada')) {
        // Copiar de novo o que já foi aplicado não volta a etapa para trás.
        registrarEvento(estado, etapa === 'copiada' ? 'copia' : 'geracao', usuario, chave, RESUMO_DA_ETAPA[etapa], quando);
        return atual;
      } else if (mesmoTexto && atual && (atual.estado === etapa || (etapa === 'gerada' && atual.estado === 'copiada'))) {
        // Repetir a etapa em que já está (ou gerar de novo o que já foi copiado) não muda nada.
        return atual;
      }
      registro.aplicacao = { estado: etapa, parametros, quando, usuario };
      registrarEvento(estado, etapa === 'gerada' ? 'geracao' : etapa === 'copiada' ? 'copia' : 'confirmacao', usuario, chave, RESUMO_DA_ETAPA[etapa], quando);
      return registro.aplicacao;
    });
    revalidar();
    return { ok: true, aplicacao };
  } catch (e) {
    return falha(e, 'etapa da UTM');
  }
}

// ---------------------------------------------------------------- exportação

const RECORTES = ['todos', 'problemas', 'validos', 'filtrados', 'selecionados'] as const;

/**
 * CSV para baixar. "todos" são os registros ativos elegíveis (o que foi
 * desligado depois de importado fica de fora); "filtrados" e "selecionados"
 * usam as chaves que a tela manda, conferidas contra o que está guardado.
 */
export async function exportarRegistros(entrada: { recorte: unknown; chaves: unknown }): Promise<{ ok: true; nome: string; conteudo: string; quantidade: number } | { ok: false; erro: string }> {
  const gestor = await exigirGestor();
  const recorte = RECORTES.find((r) => r === entrada?.recorte);
  if (!recorte) return { ok: false, erro: 'Recorte inválido.' };
  const chaves = new Set(Array.isArray(entrada.chaves) ? entrada.chaves.filter((c): c is string => typeof c === 'string').slice(0, 20000) : []);
  try {
    const painel = await carregarPainel();
    const ativos = painel.registros.filter((r) => avaliarElegibilidade(r.dados).elegibilidade === 'elegivel');
    const escolhidos =
      recorte === 'filtrados' || recorte === 'selecionados'
        ? filtrarPorRecorte(painel.registros, painel.problemas, 'selecionados', chaves)
        : filtrarPorRecorte(ativos, painel.problemas, recorte, chaves);
    const conteudo = exportarCsv(escolhidos, painel.problemas, painel.empreendimentos, painel.estado.configuracao);
    const quando = new Date().toISOString();
    await armazem().alterar((estado) => {
      registrarEvento(estado, 'exportacao', usuarioDe(gestor), null, `Exportação "${recorte}": ${escolhidos.length} registros.`, quando);
    });
    return { ok: true, nome: `utm-lotus-${recorte}-${quando.slice(0, 10)}.csv`, conteudo, quantidade: escolhidos.length };
  } catch (e) {
    return falha(e, 'exportação');
  }
}

// ---------------------------------------------------------------- empreendimentos e construtoras

export async function salvarEmpreendimento(_anterior: EstadoDoFormulario, dados: FormData): Promise<EstadoDoFormulario> {
  const gestor = await exigirGestor();
  try {
    const id = campo(dados, 'id', 200, 'Identificador');
    const formulario = {
      nome: campo(dados, 'nome', 120, 'Nome'),
      construtora: campo(dados, 'construtora', 120, 'Construtora'),
      categoria: campo(dados, 'categoria', 60, 'Categoria'),
      url: campo(dados, 'url', 500, 'URL'),
      regiao: campo(dados, 'regiao', 120, 'Região'),
      status: (campo(dados, 'status', 10, 'Status') || 'ativo') as 'ativo' | 'inativo',
      observacoes: campo(dados, 'observacoes', 1000, 'Observações'),
    };
    const { itens } = await catalogoDoSite();
    const usuario = usuarioDe(gestor);
    const resumo = await armazem().alterar((estado) => {
      const doSite = id.startsWith('site:');
      if (doSite && !itens.some((i) => idDoSite(i.slug) === id)) throw new Recusa('Empreendimento do site não encontrado.');
      if (id.startsWith('manual:') && estado.empreendimentos[id]?.origem !== 'manual') throw new Recusa('Empreendimento não encontrado.');
      if (id && !doSite && !id.startsWith('manual:')) throw new Recusa('Identificador inválido.');

      const erros = validarEmpreendimento(formulario, estado.configuracao.categorias, !doSite);
      if (erros.length) throw new Recusa(erros.join(' '));

      let guardado: EmpreendimentoGuardado;
      if (doSite) {
        guardado = { id, origem: 'site', categoria: formulario.categoria, status: formulario.status, observacoes: formulario.observacoes };
      } else {
        guardado = { ...formulario, id: id || `manual:${randomUUID()}`, origem: 'manual' };
      }
      estado.empreendimentos[guardado.id] = guardado;
      const nome = doSite ? itens.find((i) => idDoSite(i.slug) === id)?.nome : formulario.nome;
      const texto = `${id ? 'Empreendimento atualizado' : 'Empreendimento cadastrado'}: ${nome}.`;
      registrarEvento(estado, 'empreendimento', usuario, guardado.id, texto);
      return texto;
    });
    revalidar();
    return { ok: true, erro: null, mensagem: resumo };
  } catch (e) {
    return { ...falha(e, 'salvar empreendimento'), mensagem: null };
  }
}

export async function salvarConstrutora(_anterior: EstadoDoFormulario, dados: FormData): Promise<EstadoDoFormulario> {
  const gestor = await exigirGestor();
  try {
    const nome = campo(dados, 'nome', 120, 'Nome');
    const observacoes = campo(dados, 'observacoes', 1000, 'Observações');
    if (!nome) throw new Recusa('Informe o nome da construtora.');
    const usuario = usuarioDe(gestor);
    await armazem().alterar((estado) => {
      const repetida = Object.values(estado.construtoras).some((c) => c.nome.toLowerCase() === nome.toLowerCase());
      if (repetida) throw new Recusa('Já existe uma construtora com esse nome.');
      const id = `construtora:${randomUUID()}`;
      estado.construtoras[id] = { id, nome, observacoes };
      registrarEvento(estado, 'construtora', usuario, id, `Construtora cadastrada: ${nome}.`);
    });
    revalidar();
    return { ok: true, erro: null, mensagem: `Construtora cadastrada: ${nome}.` };
  } catch (e) {
    return { ...falha(e, 'salvar construtora'), mensagem: null };
  }
}

// ---------------------------------------------------------------- configuração

/** Lê o formulário de Configurações; a validação de verdade é validarConfiguracao. */
function configuracaoDoFormulario(dados: FormData): Configuracao {
  const parametros = PARAMETROS_PADRAO.map((p) => ({
    chave: p.chave,
    valor: String(dados.get(`valor:${p.chave}`) ?? '').slice(0, 300),
    // source, medium e campaign são a base de qualquer relatório: sempre obrigatórios.
    obrigatorio: ['utm_source', 'utm_medium', 'utm_campaign'].includes(p.chave) || dados.get(`obrigatorio:${p.chave}`) === 'on',
  }));
  const extras = EXTRAS_DISPONIVEIS.filter((e) => dados.get(`extra:${e.chave}`) === 'on').map((e) => ({ ...e }));
  const categorias = String(dados.get('categorias') ?? '')
    .slice(0, 5000)
    .split(/\r?\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  const severidades = Object.fromEntries(Object.keys(VERIFICACOES).map((codigo) => [codigo, String(dados.get(`severidade:${codigo}`) ?? '') as Severidade]));
  return { parametros, extras, categorias, severidades };
}

export async function salvarConfiguracao(_anterior: EstadoDoFormulario, dados: FormData): Promise<EstadoDoFormulario> {
  const gestor = await exigirGestor();
  try {
    const validada = validarConfiguracao(configuracaoDoFormulario(dados));
    if (!validada.ok) throw new Recusa(validada.erros.join(' '));
    const usuario = usuarioDe(gestor);
    await armazem().alterar((estado) => {
      const antes = JSON.stringify(estado.configuracao);
      estado.configuracao = validada.configuracao;
      if (antes !== JSON.stringify(validada.configuracao)) {
        const padrao = gerarDinamico(validada.configuracao, undefined).parametros;
        registrarEvento(estado, 'configuracao', usuario, null, `Configuração alterada. Padrão: ${padrao}`);
      }
    });
    revalidar();
    return { ok: true, erro: null, mensagem: 'Configuração salva.' };
  } catch (e) {
    return { ...falha(e, 'salvar configuração'), mensagem: null };
  }
}
