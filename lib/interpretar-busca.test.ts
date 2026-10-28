import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interpretarBusca, passaNaBusca, rotuloDeValor, type ImovelDaBusca, type LugaresDaBusca } from './interpretar-busca.ts';

/**
 * Tipo, bairro, cidade, quartos e preço tirados de /lotus-busca em 28/10/2026.
 * Os códigos e as descrições são de teste.
 */
const imovel = (codigo: string, type: string, neighborhood: string, city: string, beds: number, priceNum: number, desc = ''): ImovelDaBusca =>
  ({ codigo, type, neighborhood, city, beds, priceNum, desc });

const ACERVO: ImovelDaBusca[] = [
  imovel('AP01', 'Apartamento', 'Engordadouro', 'Jundiaí', 2, 499_000, 'Apartamento de 59 m² no Condomínio Pleno.'),
  imovel('AP02', 'Apartamento', 'Engordadouro', 'Jundiaí', 3, 630_000, 'Último andar do Condomínio Pleno.'),
  imovel('AP03', 'Apartamento', 'Medeiros', 'Jundiaí', 2, 290_000),
  imovel('AP04', 'Apartamento', 'Tulipas', 'Jundiaí', 2, 320_000),
  imovel('AP05', 'Apartamento', 'Parque Residencial Eloy Chaves', 'Jundiaí', 3, 665_000),
  imovel('AP06', 'Apartamento', 'Jardim Ermida II', 'Jundiaí', 3, 799_000, 'Vila Sereno.'),
  imovel('CA01', 'Casa', 'Chácara Malota', 'Jundiaí', 5, 2_390_000),
  imovel('CA02', 'Casa', 'Jacaré', 'Itupeva', 3, 1_490_000),
  imovel('SO01', 'Sobrado', 'Malota', 'Jundiaí', 4, 2_150_000),
  imovel('SO02', 'Sobrado', 'Jardim Primavera', 'Louveira', 4, 3_850_000),
  imovel('TE01', 'Terreno', 'Terras de Santa Teresa', 'Vinhedo', 0, 595_000),
  imovel('AP07', 'Apartamento', 'Jardim Florestal', 'Jundiaí', 3, 0),
];

const LUGARES: LugaresDaBusca = {
  bairros: [...ACERVO.map((i) => i.neighborhood), 'Eloy Chaves', 'Jardim Ermida', 'Medeiros', 'Centro'],
  cidades: ACERVO.map((i) => i.city),
};

/** Códigos que a busca devolve para o texto. */
const busca = (texto: string) => {
  const filtros = interpretarBusca(texto, LUGARES);
  return ACERVO.filter((i) => passaNaBusca(i, filtros)).map((i) => i.codigo);
};
const etiquetas = (texto: string) => interpretarBusca(texto, LUGARES).map((f) => f.label);

test('"mil" é mil, não milhão', () => {
  assert.deepEqual(etiquetas('apartamento até 500 mil'), ['até R$ 500 mil', 'Apartamento']);
  assert.deepEqual(busca('apartamento até 500 mil'), ['AP01', 'AP03', 'AP04']);
});

test('milhão, R$ e "k" também viram preço', () => {
  assert.deepEqual(etiquetas('até R$ 2,5 mi'), ['até R$ 2,5 mi']);
  assert.deepEqual(etiquetas('até 1 milhão'), ['até R$ 1 mi']);
  assert.deepEqual(etiquetas('até 1,5 milhões'), ['até R$ 1,5 mi']);
  assert.deepEqual(etiquetas('até R$ 800.000'), ['até R$ 800 mil']);
  assert.deepEqual(etiquetas('até R$ 1.064.306,74'), ['até R$ 1,06 mi']);
  assert.deepEqual(etiquetas('até 800k'), ['até R$ 800 mil']);
});

test('número solto não é preço', () => {
  assert.deepEqual(etiquetas('3 dormitórios e 250 m²'), ['3+ dorm.']);
  assert.deepEqual(etiquetas('a 4 minutos do Centro'), ['Centro']);
});

test('"acima de" é piso; dois valores são faixa', () => {
  assert.deepEqual(etiquetas('acima de 2 milhões'), ['a partir de R$ 2 mi']);
  assert.deepEqual(etiquetas('a partir de R$ 800 mil'), ['a partir de R$ 800 mil']);
  assert.deepEqual(busca('acima de 2 milhões'), ['CA01', 'SO01', 'SO02']);
  assert.deepEqual(etiquetas('entre 500 mil e 1 milhão'), ['a partir de R$ 500 mil', 'até R$ 1 mi']);
  assert.deepEqual(busca('entre 500 mil e 1 milhão'), ['AP02', 'AP05', 'AP06', 'TE01']);
});

test('imóvel sem preço não entra em faixa de preço', () => {
  assert.equal(busca('até 1 milhão').includes('AP07'), false);
  assert.equal(busca('apartamento').includes('AP07'), true);
});

test('o exemplo da caixa de busca acha imóvel', () => {
  // Antes virava o filtro "serra", que não está em bairro nenhum.
  assert.deepEqual(etiquetas('casa com 4 suítes perto da Serra do Japi até R$ 2,5 mi'), ['4+ dorm.', 'até R$ 2,5 mi', 'Casa']);
  assert.deepEqual(busca('casa com 4 suítes perto da Serra do Japi até R$ 2,5 mi'), ['CA01']);
});

test('quartos por extenso e o maior número da frase', () => {
  assert.deepEqual(etiquetas('apartamento de dois quartos'), ['2+ dorm.', 'Apartamento']);
  assert.deepEqual(etiquetas('3 quartos sendo 1 suíte'), ['3+ dorm.']);
});

test('bairro e cidade do acervo viram filtro, sem acento e sem caixa', () => {
  assert.deepEqual(busca('apartamento no Engordadouro'), ['AP01', 'AP02']);
  assert.deepEqual(busca('imóvel em louveira'), ['SO02']);
  assert.deepEqual(busca('casa em itupeva'), ['CA02']);
  assert.equal(busca('jundiai').length, 9);
});

test('nome do bairro sem o "Jardim", o "Parque" e o número', () => {
  assert.deepEqual(etiquetas('eloy chaves'), ['Eloy Chaves']);
  assert.deepEqual(busca('eloy chaves'), ['AP05']);
  assert.deepEqual(busca('apartamento no ermida'), ['AP06']);
  assert.deepEqual(busca('jardim ermida'), ['AP06']);
});

test('bairro vale mais que cidade, e o nome mais longo mais que o curto', () => {
  assert.deepEqual(etiquetas('casa no Medeiros, Jundiaí'), ['Medeiros', 'Casa']);
  assert.deepEqual(busca('chácara malota'), ['CA01']);
  assert.deepEqual(busca('malota'), ['CA01', 'SO01']);
});

test('lugar sem imóvel no acervo devolve vazio, e não a região inteira', () => {
  assert.deepEqual(etiquetas('casa em Valinhos'), ['Valinhos', 'Casa']);
  assert.deepEqual(busca('casa em Valinhos'), []);
});

test('sobrado e lote são tipos', () => {
  assert.deepEqual(busca('sobrado'), ['SO01', 'SO02']);
  assert.deepEqual(busca('lote em condomínio'), ['TE01']);
});

test('texto sem filtro reconhecido é procurado nos anúncios', () => {
  assert.deepEqual(etiquetas('Condomínio Pleno'), ['“Condomínio Pleno”']);
  assert.deepEqual(busca('Condomínio Pleno'), ['AP01', 'AP02']);
  assert.deepEqual(busca('vila sereno'), ['AP06']);
  assert.deepEqual(busca('so02'), ['SO02']);
  assert.deepEqual(busca('piscina aquecida'), []);
});

test('texto vazio não vira filtro', () => {
  assert.deepEqual(interpretarBusca('   ', LUGARES), []);
});

test('rótulo de valor', () => {
  assert.equal(rotuloDeValor(500_000), 'R$ 500 mil');
  assert.equal(rotuloDeValor(1_000_000), 'R$ 1 mi');
  assert.equal(rotuloDeValor(2_500_000), 'R$ 2,5 mi');
  assert.equal(rotuloDeValor(99_000_000), 'R$ 99 mi');
});
