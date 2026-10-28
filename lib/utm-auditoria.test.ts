import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { criarArmazem, estadoInicial, registrarEvento } from './utm/armazem.ts';
import { auditarRegistro, auditarTodos, rastreamentoDo } from './utm/auditoria.ts';
import { configuracaoPadrao } from './utm/configuracao.ts';
import { lerCsv } from './utm/csv.ts';
import { exportarCsv, filtrarPorRecorte } from './utm/exportar.ts';
import type { Registro } from './utm/tipos.ts';

const PADRAO = 'utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}';

function registro(chave: string, dados: Registro['dados'], extra: Partial<Registro> = {}): Registro {
  return {
    chave,
    nivel: 'anuncio',
    dados: { campanhaId: '1', campanhaNome: 'Vigore', anuncioId: chave.split(':')[1], ...dados },
    primeiraImportacao: '2026-10-28T12:00:00.000Z',
    ultimaImportacao: '2026-10-28T12:00:00.000Z',
    loteId: 'l1',
    ausenteNaUltimaImportacao: false,
    associacao: { empreendimentoId: 'site:vigore', origem: 'url' },
    observacoes: '',
    aplicacao: null,
    ...extra,
  };
}

const codigos = (r: Registro) => auditarRegistro(r, configuracaoPadrao()).map((p) => `${p.severidade}:${p.codigo}`);

test('padrão completo com macros é UTM válida: macro não substituída não é defeito', () => {
  const r = registro('anuncio:10', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: PADRAO });
  assert.deepEqual(codigos(r), []);
  assert.equal(rastreamentoDo(r, auditarRegistro(r, configuracaoPadrao())), 'valido');
});

test('sem UTM nenhuma: parâmetros ausentes e rastreamento "ausente"', () => {
  const r = registro('anuncio:11', { urlDestino: 'https://www.lotusbrokers.com.br/vigore' });
  assert.deepEqual(codigos(r), ['atencao:utm-ausente', 'atencao:utm-ausente', 'atencao:utm-ausente', 'atencao:utm-ausente', 'atencao:utm-ausente']);
  assert.equal(rastreamentoDo(r, auditarRegistro(r, configuracaoPadrao())), 'ausente');
});

test('URL malformada, conflito entre URL e parâmetros e macro estragada são críticos', () => {
  assert.ok(codigos(registro('anuncio:12', { urlDestino: 'lotusbrokers.com.br/vigore', parametrosUrl: PADRAO })).includes('critico:url-invalida'));
  const conflito = registro('anuncio:13', { urlDestino: 'https://www.lotusbrokers.com.br/vigore?utm_source=site', parametrosUrl: PADRAO });
  assert.ok(codigos(conflito).includes('critico:utm-conflitante'));
  const macro = registro('anuncio:14', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: PADRAO.replace('{{ad.name}}', '%7B%7Bad.name%7D%7D') });
  assert.ok(codigos(macro).includes('critico:macro-corrompida'));
  assert.equal(rastreamentoDo(macro, auditarRegistro(macro, configuracaoPadrao())), 'critico');
});

test('vazio, duplicado, fora do padrão e sem empreendimento', () => {
  const r = registro('anuncio:15', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: `${PADRAO.replace('paid_social', 'cpc')}&utm_term=&utm_term=` }, { associacao: null });
  const lista = codigos(r);
  assert.ok(lista.includes('informativo:fora-do-padrao'));
  assert.ok(lista.includes('atencao:utm-vazio'));
  assert.ok(lista.includes('critico:utm-conflitante'), 'utm_term com {{adset.name}} e vazio');
  assert.ok(lista.includes('informativo:sem-empreendimento'));
});

test('anúncios da mesma campanha com utm_campaign fixo diferente', () => {
  const a = registro('anuncio:16', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: PADRAO.replace('{{campaign.name}}', 'vigore-out') });
  const b = registro('anuncio:17', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: PADRAO.replace('{{campaign.name}}', 'vigore-outubro') });
  const resultado = auditarTodos([a, b], configuracaoPadrao());
  assert.ok(resultado.get('anuncio:16')!.some((p) => p.codigo === 'campanha-inconsistente'));
});

test('a severidade segue a configuração', () => {
  const configuracao = { ...configuracaoPadrao(), severidades: { ...configuracaoPadrao().severidades, 'sem-empreendimento': 'atencao' as const } };
  const r = registro('anuncio:18', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: PADRAO }, { associacao: null });
  assert.deepEqual(auditarRegistro(r, configuracao).map((p) => p.severidade), ['atencao']);
});

test('exportação: colunas, recortes e proteção contra fórmula', () => {
  const valido = registro('anuncio:20', { urlDestino: 'https://www.lotusbrokers.com.br/vigore', parametrosUrl: PADRAO, anuncioNome: '=CMD()' });
  const problema = registro('anuncio:21', { urlDestino: 'https://www.lotusbrokers.com.br/vigore' });
  const problemas = auditarTodos([valido, problema], configuracaoPadrao());
  assert.deepEqual(filtrarPorRecorte([valido, problema], problemas, 'problemas', new Set()).map((r) => r.chave), ['anuncio:21']);
  assert.deepEqual(filtrarPorRecorte([valido, problema], problemas, 'validos', new Set()).map((r) => r.chave), ['anuncio:20']);
  assert.deepEqual(filtrarPorRecorte([valido, problema], problemas, 'selecionados', new Set(['anuncio:21'])).map((r) => r.chave), ['anuncio:21']);

  const csv = exportarCsv([valido], problemas, [], configuracaoPadrao());
  const tabela = lerCsv(csv);
  assert.equal(tabela.cabecalho[1], 'ID da campanha');
  const linha = Object.fromEntries(tabela.cabecalho.map((c, i) => [c, tabela.linhas[0].campos[i]]));
  assert.equal(linha['Anúncio'], `'=CMD()`);
  assert.equal(linha['Resultado da auditoria'], 'UTM válida');
  assert.equal(linha['Modelo de parâmetros (padrão)'], PADRAO);
  assert.equal(linha['URL montada pela Meta'], `https://www.lotusbrokers.com.br/vigore?${PADRAO}`);
  assert.equal(linha['Empreendimento'], 'Empreendimento não identificado', 'sem o empreendimento na lista, não inventa nome');
});

test('armazém: os dados sobrevivem a um novo processo (nova instância lendo a mesma pasta)', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'utm-'));
  try {
    const primeiro = criarArmazem(pasta);
    assert.deepEqual(await primeiro.ler(), estadoInicial(), 'pasta vazia começa do estado inicial');
    await primeiro.alterar((estado) => {
      estado.registros['anuncio:1'] = registro('anuncio:1', { urlDestino: 'https://www.lotusbrokers.com.br/vigore' });
      registrarEvento(estado, 'importacao', { id: 'u1', nome: 'Octo' }, null, 'teste', '2026-10-28T12:00:00.000Z');
    });
    const reaberto = criarArmazem(pasta);
    const estado = await reaberto.ler();
    assert.deepEqual(Object.keys(estado.registros), ['anuncio:1']);
    assert.equal(estado.historico[0].resumo, 'teste');
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});

test('armazém: alterações simultâneas não se perdem, e arquivo ilegível não é sobrescrito', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'utm-'));
  try {
    const armazem = criarArmazem(pasta);
    await Promise.all(Array.from({ length: 20 }, (_, i) => armazem.alterar((e) => registrarEvento(e, 'atualizacao', null, null, `evento ${i}`))));
    assert.equal((await armazem.ler()).historico.length, 20);

    await writeFile(armazem.arquivo, '{ quebrado', 'utf8');
    await assert.rejects(armazem.alterar((e) => registrarEvento(e, 'atualizacao', null, null, 'não pode gravar')), /ilegível/);
    assert.equal(await readFile(armazem.arquivo, 'utf8'), '{ quebrado');
    const anterior = JSON.parse(await readFile(join(pasta, 'estado.anterior.json'), 'utf8'));
    assert.equal(anterior.historico.length, 19, 'a cópia anterior guarda o estado antes da última gravação');
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});
