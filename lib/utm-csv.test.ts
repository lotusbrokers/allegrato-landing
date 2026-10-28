import assert from 'node:assert/strict';
import { test } from 'node:test';
import { celulaSegura, decodificarArquivo, detectarDelimitador, escreverCsv, lerCsv } from './utm/csv.ts';
import { aplicarMapeamento, camposQueFaltam, mapearColunas, normalizarCabecalho } from './utm/colunas.ts';

const bytes = (texto: string) => new TextEncoder().encode(texto);

test('CSV separado por vírgula, com aspas, vírgula e quebra de linha dentro do campo', () => {
  const t = lerCsv('Campaign name,Ad name\n"Lançamento, Jundiaí","Linha 1\nLinha 2"\nOutra,"Com ""aspas"""\n');
  assert.equal(t.delimitador, ',');
  assert.deepEqual(t.cabecalho, ['Campaign name', 'Ad name']);
  assert.deepEqual(t.linhas.map((l) => l.campos), [
    ['Lançamento, Jundiaí', 'Linha 1\nLinha 2'],
    ['Outra', 'Com "aspas"'],
  ]);
  assert.deepEqual(t.linhas.map((l) => l.numero), [2, 4], 'a linha conta as quebras dentro das aspas');
  assert.deepEqual(t.avisos, []);
});

test('CSV separado por ponto e vírgula, com CRLF e BOM', () => {
  const t = lerCsv('﻿Nome da campanha;URL\r\nAllegrato;https://www.lotusbrokers.com.br/allegrato?a=1,2\r\n');
  assert.equal(t.delimitador, ';');
  assert.deepEqual(t.cabecalho, ['Nome da campanha', 'URL']);
  assert.deepEqual(t.linhas[0].campos, ['Allegrato', 'https://www.lotusbrokers.com.br/allegrato?a=1,2']);
});

test('delimitador conta só fora das aspas', () => {
  assert.equal(detectarDelimitador('"a;b;c",d,e\n'), ',');
  assert.equal(detectarDelimitador('a\tb\tc\n'), '\t');
});

test('arquivo vazio, só cabeçalho, linha incompleta e coluna repetida viram aviso', () => {
  assert.deepEqual(lerCsv('').avisos, ['O arquivo está vazio.']);
  assert.deepEqual(lerCsv('\n\n  \n').avisos, ['O arquivo está vazio.']);
  assert.match(lerCsv('a,b\n').avisos.join(), /só tem o cabeçalho/);
  const t = lerCsv('a,b,c\n1,2\n1,2,3,4\n');
  assert.deepEqual(t.linhas[0].campos, ['1', '2', '']);
  assert.deepEqual(t.linhas[1].campos, ['1', '2', '3']);
  assert.match(t.avisos.join(' | '), /Linha 2 incompleta/);
  assert.match(t.avisos.join(' | '), /Linha 3 com mais colunas/);
  assert.match(lerCsv('Ad name,ad name\nx,y\n').avisos.join(), /Colunas repetidas/);
});

test('codificação: UTF-8 com e sem BOM, UTF-16 e Windows-1252 do Excel', () => {
  assert.equal(decodificarArquivo(bytes('Anúncio')).texto, 'Anúncio');
  assert.equal(decodificarArquivo(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('Anúncio')])).texto, 'Anúncio');
  const utf16 = new Uint8Array([0xff, 0xfe, ...[...'Anúncio'].flatMap((c) => [c.charCodeAt(0), 0])]);
  assert.equal(decodificarArquivo(utf16).texto, 'Anúncio');
  // "Anúncio" em Windows-1252: o "ú" é o byte 0xFA, inválido em UTF-8.
  const ansi = decodificarArquivo(new Uint8Array([0x41, 0x6e, 0xfa, 0x6e, 0x63, 0x69, 0x6f]));
  assert.equal(ansi.texto, 'Anúncio');
  assert.equal(ansi.codificacao, 'windows-1252');
  assert.match(ansi.aviso ?? '', /Windows-1252/);
  assert.match(decodificarArquivo(bytes('AnÃºncio')).aviso ?? '', /corrompidos/);
});

test('cabeçalhos do Meta em português e em inglês viram campos', () => {
  const pt = mapearColunas(['ID da campanha', 'Nome da campanha', 'Status da campanha', 'ID do conjunto de anúncios', 'Nome do conjunto de anúncios', 'ID do anúncio', 'Nome do anúncio', 'Status do anúncio', 'Veiculação', 'Parâmetros de URL', 'Alcance']);
  assert.equal(pt.mapeamento.campanhaId, 0);
  assert.equal(pt.mapeamento.conjuntoNome, 4);
  assert.equal(pt.mapeamento.anuncioStatus, 7);
  assert.equal(pt.mapeamento.veiculacao, 8);
  assert.equal(pt.mapeamento.parametrosUrl, 9);
  assert.deepEqual(pt.ignoradas, ['Alcance']);

  const en = mapearColunas(['Campaign ID', 'Campaign Name', 'Campaign Status', 'Ad Set Run Status', 'Ad ID', 'Ad Name', 'Link', 'URL Tags', 'Reporting starts']);
  assert.equal(en.mapeamento.campanhaNome, 1);
  assert.equal(en.mapeamento.conjuntoStatus, 3);
  assert.equal(en.mapeamento.urlDestino, 6);
  assert.equal(en.mapeamento.parametrosUrl, 7);
  assert.equal(en.mapeamento.inicio, null, 'início dos relatórios não é a data de início da campanha');
  assert.equal(normalizarCabecalho('Nome do anúncio (Ad name)'), 'nome do anuncio');
});

test('cabeçalho desconhecido: nada mapeado e o mínimo para importar falta', () => {
  const { mapeamento, ignoradas } = mapearColunas(['Coluna A', 'Coluna B']);
  assert.ok(Object.values(mapeamento).every((v) => v === null));
  assert.deepEqual(ignoradas, ['Coluna A', 'Coluna B']);
  assert.deepEqual(camposQueFaltam(mapeamento), ['campanhaId', 'campanhaNome']);
});

test('linha mapeada leva só os campos mapeados e não vazios', () => {
  const { mapeamento } = mapearColunas(['Campaign ID', 'Campaign Name', 'Alcance']);
  assert.deepEqual(aplicarMapeamento([{ numero: 2, campos: [' 120 ', 'Allegrato', '999'] }, { numero: 3, campos: ['121', '', '1'] }], mapeamento), [
    { linha: 2, campanhaId: '120', campanhaNome: 'Allegrato' },
    { linha: 3, campanhaId: '121' },
  ]);
});

test('exportação: BOM, ponto e vírgula, aspas e proteção contra fórmula', () => {
  const csv = escreverCsv([['Nome', 'Valor'], ['=HYPERLINK("x")', 'a;b'], ['+55 11', 'linha\nquebrada']]);
  assert.ok(csv.startsWith('﻿Nome;Valor\r\n'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")";"a;b"`));
  assert.ok(csv.includes(`'+55 11;"linha\nquebrada"`));
  assert.equal(celulaSegura('-1'), "'-1");
  assert.equal(celulaSegura('Allegrato'), 'Allegrato');
  const relido = lerCsv(csv);
  assert.deepEqual(relido.linhas[0].campos, [`'=HYPERLINK("x")`, 'a;b']);
});
