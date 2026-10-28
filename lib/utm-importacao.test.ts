import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estadoInicial } from './utm/armazem.ts';
import { aplicarMapeamento, mapearColunas } from './utm/colunas.ts';
import { lerCsv } from './utm/csv.ts';
import { empreendimentoPelaUrl, listarEmpreendimentos, type ItemDoCatalogo } from './utm/empreendimentos.ts';
import { aplicarImportacao, prepararImportacao, problemaNoId, validarLinhas, type ContextoDaImportacao } from './utm/importacao.ts';
import { avaliarElegibilidade, estadoConfigurado, lerVeiculacao } from './utm/status.ts';
import type { EstadoUtm } from './utm/tipos.ts';

/** CSV no formato da exportação de edição em massa do Meta Ads. */
const CSV = [
  'Campaign ID,Campaign Name,Campaign Status,Ad Set ID,Ad Set Name,Ad Set Run Status,Ad ID,Ad Name,Ad Status,Link,URL Tags',
  '120200000000000001,Vigore Outubro,ACTIVE,120200000000000101,Jundiaí 25-45,ACTIVE,120200000000001001,Carrossel 1,ACTIVE,https://www.lotusbrokers.com.br/vigore,utm_source={{site_source_name}}&utm_medium=paid_social',
  '120200000000000001,Vigore Outubro,ACTIVE,120200000000000101,Jundiaí 25-45,ACTIVE,120200000000001002,Vídeo 15s,PAUSED,https://www.lotusbrokers.com.br/vigore,',
  '120200000000000002,Institucional,PAUSED,120200000000000102,Geral,ACTIVE,120200000000001003,Marca,ACTIVE,https://www.lotusbrokers.com.br/,',
  '120200000000000001,Vigore Outubro,ACTIVE,120200000000000101,Jundiaí 25-45,ACTIVE,120200000000001001,Carrossel 1,ACTIVE,https://www.lotusbrokers.com.br/vigore,',
  '1.20200000000000E+17,Sem ID,ACTIVE,,,,,,,,',
].join('\n');

function linhasDoCsv(texto = CSV) {
  const tabela = lerCsv(texto);
  return aplicarMapeamento(tabela.linhas, mapearColunas(tabela.cabecalho).mapeamento);
}

const CATALOGO: ItemDoCatalogo[] = [
  { slug: 'vigore', nome: 'Vigóre', construtora: 'Santa Angela', caminho: '/vigore', bairro: 'Colônia', cidade: 'Jundiaí' },
  { slug: 'allegrato', nome: 'Allegrato', construtora: 'Santa Angela', caminho: '/allegrato', bairro: 'Medeiros', cidade: 'Jundiaí' },
];

function contexto(estado: EstadoUtm, quando = '2026-10-28T12:00:00.000Z'): ContextoDaImportacao {
  const empreendimentos = listarEmpreendimentos(CATALOGO, estado.empreendimentos, 'https://www.lotusbrokers.com.br');
  return { quando, usuario: { id: 'u1', nome: 'Octo' }, arquivo: 'meta.csv', loteId: `lote-${quando}`, empreendimentoDaUrl: (url) => empreendimentoPelaUrl(url, empreendimentos) };
}

test('status configurado e veiculação são coisas diferentes', () => {
  assert.equal(estadoConfigurado('ACTIVE'), 'ativo');
  assert.equal(estadoConfigurado('Pausada'), 'pausado');
  assert.equal(estadoConfigurado(''), null);
  assert.equal(estadoConfigurado('talvez'), 'desconhecido');
  assert.equal(lerVeiculacao('Active'), 'veiculando');
  assert.equal(lerVeiculacao('Aprendizado limitado'), 'veiculando');
  assert.equal(lerVeiculacao('Não está sendo veiculado'), 'parado');
  assert.equal(lerVeiculacao('Campanha desativada'), 'desligado');
  assert.equal(lerVeiculacao('Concluída'), 'desligado');
});

test('anúncio pausado em campanha ativa não é ativo; campanha pausada derruba os anúncios', () => {
  const base = { campanhaId: '1', conjuntoId: '2', anuncioId: '3', campanhaStatus: 'ACTIVE', conjuntoStatus: 'ACTIVE' };
  assert.deepEqual(avaliarElegibilidade({ ...base, anuncioStatus: 'PAUSED' }), { elegibilidade: 'inelegivel', motivos: ['Anúncio pausado.'] });
  assert.deepEqual(avaliarElegibilidade({ ...base, campanhaStatus: 'PAUSED', anuncioStatus: 'ACTIVE' }), { elegibilidade: 'inelegivel', motivos: ['Campanha pausada.'] });
  assert.equal(avaliarElegibilidade({ ...base, anuncioStatus: 'ACTIVE' }).elegibilidade, 'elegivel');
});

test('sem status suficiente não presume ativo; a veiculação resolve quando existe', () => {
  const soAnuncio = { campanhaId: '1', conjuntoId: '2', anuncioId: '3', anuncioStatus: 'ACTIVE' };
  const revisao = avaliarElegibilidade(soAnuncio);
  assert.equal(revisao.elegibilidade, 'revisao');
  assert.match(revisao.motivos[0], /campanha, conjunto de anúncios/);
  assert.equal(avaliarElegibilidade({ ...soAnuncio, veiculacao: 'Active' }).elegibilidade, 'elegivel');
  assert.equal(avaliarElegibilidade({ ...soAnuncio, veiculacao: 'Inactive' }).elegibilidade, 'inelegivel');
  assert.equal(avaliarElegibilidade({ ...soAnuncio, veiculacao: 'qualquer coisa' }).elegibilidade, 'revisao');
});

test('ligado mas não veiculando entra, com o aviso de que não está no ar', () => {
  const r = avaliarElegibilidade({ campanhaId: '1', campanhaStatus: 'ACTIVE', veiculacao: 'Not delivering' });
  assert.equal(r.elegibilidade, 'elegivel');
  assert.match(r.motivos.join(), /sem veicular/);
});

test('ID em notação científica do Excel vai para revisão', () => {
  assert.match(problemaNoId('1.20200000000000E+17') ?? '', /notação científica/);
  assert.equal(problemaNoId('120200000000000001'), null);
  assert.match(problemaNoId('abc') ?? '', /não é um número/);
});

test('prévia: elegíveis, inelegíveis, duplicados no arquivo e revisão', () => {
  const previa = prepararImportacao(linhasDoCsv(), {});
  const porLinha = Object.fromEntries(previa.candidatos.map((c) => [c.linha, c]));
  assert.equal(porLinha[2].elegibilidade, 'elegivel');
  assert.equal(porLinha[2].chave, 'anuncio:120200000000001001');
  assert.equal(porLinha[3].elegibilidade, 'inelegivel', 'anúncio pausado');
  assert.equal(porLinha[4].elegibilidade, 'inelegivel', 'campanha pausada');
  assert.equal(porLinha[5].duplicadoNoArquivo, true);
  assert.equal(porLinha[6].elegibilidade, 'revisao');
  assert.deepEqual(previa.contagens, { encontrados: 5, elegiveis: 1, novos: 1, atualizados: 0, desligados: 0, duplicados: 1, revisao: 1 });
});

test('importa só os elegíveis escolhidos, guardando os IDs como texto e associando pela URL', () => {
  const estado = estadoInicial();
  const previa = prepararImportacao(linhasDoCsv(), estado.registros);
  const lote = aplicarImportacao(estado, previa, new Set(['anuncio:120200000000001001', 'anuncio:120200000000001002']), contexto(estado));
  assert.deepEqual(Object.keys(estado.registros), ['anuncio:120200000000001001']);
  const r = estado.registros['anuncio:120200000000001001'];
  assert.equal(r.dados.campanhaId, '120200000000000001');
  assert.deepEqual(r.associacao, { empreendimentoId: 'site:vigore', origem: 'url' });
  assert.equal(lote.contagens.importados, 1);
  assert.equal(lote.contagens.ignorados, 4);
});

test('reimportar não duplica, atualiza o que veio do CSV e preserva o que a equipe editou', () => {
  const estado = estadoInicial();
  const chave = 'anuncio:120200000000001001';
  aplicarImportacao(estado, prepararImportacao(linhasDoCsv(), estado.registros), new Set([chave]), contexto(estado));
  estado.registros[chave].observacoes = 'Criativo aprovado pela construtora';
  estado.registros[chave].associacao = { empreendimentoId: 'site:allegrato', origem: 'manual' };
  estado.registros[chave].aplicacao = { estado: 'confirmada', parametros: 'utm_source={{site_source_name}}&utm_medium=paid_social', quando: '2026-10-28T12:30:00.000Z', usuario: null };

  const renomeado = CSV.replace('Carrossel 1,ACTIVE,https://www.lotusbrokers.com.br/vigore,utm', 'Carrossel 1 (novo),ACTIVE,https://www.lotusbrokers.com.br/vigore,utm');
  const previa = prepararImportacao(linhasDoCsv(renomeado), estado.registros);
  const candidato = previa.candidatos.find((c) => c.chave === chave);
  assert.equal(candidato?.situacao, 'atualizacao');
  assert.deepEqual(candidato?.mudancas, ['Nome do anúncio']);

  const lote = aplicarImportacao(estado, previa, new Set([chave]), contexto(estado, '2026-10-29T12:00:00.000Z'));
  assert.equal(lote.contagens.validados, 1);
  const r = estado.registros[chave];
  assert.equal(Object.keys(estado.registros).length, 1);
  assert.equal(r.dados.anuncioNome, 'Carrossel 1 (novo)');
  assert.equal(r.observacoes, 'Criativo aprovado pela construtora');
  assert.deepEqual(r.associacao, { empreendimentoId: 'site:allegrato', origem: 'manual' }, 'a associação manual vence a da URL');
  assert.equal(r.aplicacao?.estado, 'validada', 'os parâmetros que voltaram da Meta são os gerados');
  assert.equal(r.primeiraImportacao, '2026-10-28T12:00:00.000Z');
});

test('registro que sumiu do arquivo é sinalizado, não apagado; o que voltou pausado é atualizado', () => {
  const estado = estadoInicial();
  const csvDoisAtivos = CSV.replace('Vídeo 15s,PAUSED', 'Vídeo 15s,ACTIVE');
  const chaves = new Set(['anuncio:120200000000001001', 'anuncio:120200000000001002']);
  aplicarImportacao(estado, prepararImportacao(linhasDoCsv(csvDoisAtivos), estado.registros), chaves, contexto(estado));
  assert.equal(Object.keys(estado.registros).length, 2);

  // Na segunda exportação o vídeo veio pausado e o carrossel não veio.
  const segunda = [CSV.split('\n')[0], CSV.split('\n')[2]].join('\n');
  const previa = prepararImportacao(linhasDoCsv(segunda), estado.registros);
  assert.equal(previa.contagens.desligados, 1);
  aplicarImportacao(estado, previa, new Set(), contexto(estado, '2026-10-29T12:00:00.000Z'));
  assert.equal(estado.registros['anuncio:120200000000001002'].dados.anuncioStatus, 'PAUSED');
  assert.equal(estado.registros['anuncio:120200000000001002'].ausenteNaUltimaImportacao, false);
  assert.equal(estado.registros['anuncio:120200000000001001'].ausenteNaUltimaImportacao, true);
  assert.equal(Object.keys(estado.registros).length, 2, 'nada foi apagado');
});

test('associação pela URL só quando há um empreendimento com aquela página', () => {
  const empreendimentos = listarEmpreendimentos(CATALOGO, {}, 'https://www.lotusbrokers.com.br');
  assert.equal(empreendimentoPelaUrl('https://lotusbrokers.com.br/vigore/?utm_source=x#a', empreendimentos), 'site:vigore');
  assert.equal(empreendimentoPelaUrl('https://wa.me/5511926143393', empreendimentos), null);
  assert.equal(empreendimentoPelaUrl(undefined, empreendimentos), null);
  const vigore = empreendimentos.find((e) => e.id === 'site:vigore')!;
  const repetido = [...empreendimentos, { ...vigore, id: 'manual:x', origem: 'manual' as const }];
  assert.equal(empreendimentoPelaUrl('https://www.lotusbrokers.com.br/vigore', repetido), null, 'duas páginas iguais: na dúvida, não associa');
});

test('o servidor recusa entrada que não veio da tela de importação', () => {
  assert.equal(validarLinhas('texto').ok, false);
  assert.equal(validarLinhas([]).ok, false);
  assert.equal(validarLinhas([{ linha: 2, campanhaId: 123 }]).ok, false);
  assert.equal(validarLinhas([{ linha: 2, campanhaNome: 'x'.repeat(501) }]).ok, false);
  const limpo = validarLinhas([{ linha: 2, campanhaId: ' 1 ', campanhaNome: 'Vigore\u0007', outroCampo: 'ignorado' }]);
  assert.deepEqual(limpo, { ok: true, linhas: [{ linha: 2, campanhaId: '1', campanhaNome: 'Vigore' }] });
});
