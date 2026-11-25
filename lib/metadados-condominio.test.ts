import assert from 'node:assert/strict';
import { test } from 'node:test';
import { descricaoComDados, descricaoDoCondominio, tituloDoCondominio, valorCurto } from './metadados-condominio.ts';
import { comodidadesDoCondominio, comodidadesParaABusca } from './comodidades-condominio.ts';

test('descrição com os dados: onde fica, comodidades e o que a página tem (N15)', () => {
  const d = descricaoComDados({
    nome: 'Residencial Mirante',
    bairro: 'Vila Rio Branco',
    cidade: 'Jundiaí',
    comodidades: ['Portaria 24h', 'Piscina', 'Academia', 'Salão de festas'],
    imoveisAVenda: 0,
    menorPreco: null,
  });
  assert.equal(
    d,
    'Residencial Mirante, condomínio no bairro Vila Rio Branco, em Jundiaí. Com portaria 24h, piscina e academia. Guia com fotos, mapa e corretor da Lotus.',
  );
  assert.ok(d && d.length <= 155);
});

test('com imóvel à venda, a descrição diz quantos e o menor preço, sem arredondar para cima', () => {
  const d = descricaoComDados({
    nome: 'Eleve',
    bairro: 'Medeiros',
    cidade: 'Jundiaí',
    comodidades: ['Piscina'],
    imoveisAVenda: 3,
    menorPreco: 467_642.19,
  });
  assert.equal(d, 'Eleve, condomínio no bairro Medeiros, em Jundiaí: 3 imóveis à venda a partir de R$ 467 mil. Com piscina. Guia com fotos, mapa e corretor da Lotus.');
  assert.match(
    descricaoComDados({ nome: 'Eleve', bairro: 'Medeiros', cidade: 'Jundiaí', comodidades: [], imoveisAVenda: 1, menorPreco: null }) ?? '',
    /: 1 imóvel à venda\. /,
  );
});

test('nome que já começa com "Condomínio" não repete a palavra', () => {
  const d = descricaoComDados({
    nome: 'Condomínio Chácara Primavera',
    bairro: 'Jardim Primavera',
    cidade: 'Itupeva',
    comodidades: ['Portaria 24h'],
    imoveisAVenda: 0,
    menorPreco: null,
  });
  assert.ok(d?.startsWith('Condomínio Chácara Primavera, no bairro Jardim Primavera, em Itupeva.'), d ?? '');
});

test('bairro que repete o nome do condomínio fica de fora', () => {
  const base = { cidade: 'Jundiaí', comodidades: ['Piscina'], imoveisAVenda: 0, menorPreco: null };
  assert.ok(
    descricaoComDados({ ...base, nome: 'Residencial Pecan', bairro: 'Residencial Pecan' })?.startsWith('Residencial Pecan, condomínio em Jundiaí.'),
  );
  assert.ok(
    descricaoComDados({ ...base, nome: 'Reserva da Serra', bairro: 'Condomínio Reserva da Serra' })?.startsWith('Reserva da Serra, condomínio em Jundiaí.'),
  );
});

test('sem bairro, comodidade nem imóvel, fica o texto da Dashboard (null)', () => {
  assert.equal(
    descricaoComDados({ nome: 'Eleve', bairro: '  ', cidade: 'Jundiaí', comodidades: [], imoveisAVenda: 0, menorPreco: null }),
    null,
  );
});

test('nome comprido: some o fecho, depois as comodidades, e nunca passa de 155', () => {
  const d = descricaoComDados({
    nome: 'Condomínio Residencial Terras de São Carlos Fase Dois',
    bairro: 'Parque Residencial Eloy Chaves',
    cidade: 'Jundiaí',
    comodidades: ['Portaria 24h', 'Piscina', 'Academia'],
    imoveisAVenda: 12,
    menorPreco: 1_234_567,
  });
  assert.ok(d && d.length <= 155, `${d?.length}: ${d}`);
  assert.ok(d?.includes('12 imóveis à venda a partir de R$ 1,23 milhão'), d ?? '');
  assert.ok(!d?.includes('Guia com fotos'), d ?? '');
});

test('preço curto: mil e milhão, sempre para baixo', () => {
  assert.equal(valorCurto(467_642.19), 'R$ 467 mil');
  assert.equal(valorCurto(999_999), 'R$ 999 mil');
  assert.equal(valorCurto(1_234_567), 'R$ 1,23 milhão');
  assert.equal(valorCurto(2_500_000), 'R$ 2,5 milhões');
});

test('preço sem sentido (abaixo de R$ 1.000) fica fora do "a partir de"', () => {
  const d = descricaoComDados({ nome: 'Eleve', bairro: 'Medeiros', cidade: 'Jundiaí', comodidades: [], imoveisAVenda: 2, menorPreco: 450 });
  assert.ok(d?.includes(': 2 imóveis à venda.'), d ?? '');
});

test('comodidades: a página mostra na ordem da Dash; a busca põe portaria e piscina na frente', () => {
  const cond = { infra_piscina: true, infra_portaria_24h: true, infra_wifi: true, infra_academia: false, infra_playground: null };
  assert.deepEqual(comodidadesDoCondominio(cond), ['Piscina', 'Portaria 24h', 'Wi-Fi nas áreas comuns']);
  assert.deepEqual(comodidadesParaABusca(cond), ['Portaria 24h', 'Piscina']);
});

test('o título do condomínio cabe em 70 caracteres e diz a cidade', () => {
  assert.equal(tituloDoCondominio('Eleve', 'Jundiaí'), 'Eleve, Jundiaí: guia do condomínio e imóveis | Lotus Brokers');
  // 84 e 73 caracteres nas duas primeiras formas: fica a terceira.
  assert.equal(tituloDoCondominio('Residencial Linea Style Home', 'Jundiaí'), 'Residencial Linea Style Home, Jundiaí | Lotus Brokers');
  for (const nome of ['Eleve', 'Condomínio Residencial Terras de São Carlos', 'Reserva da Serra Residencial e Clube']) {
    const t = tituloDoCondominio(nome, 'Itupeva');
    assert.ok(t.length <= 70 || t === `${nome}, Itupeva`, t);
    assert.ok(t.includes('Itupeva'), t);
  }
});

test('fases do mesmo condomínio, com o mesmo texto na Dash, saem com descrições diferentes', () => {
  // O número da fase só aparece depois do corte de 155 caracteres.
  const texto =
    'Condomínio Japi Ecovillage – Natureza, segurança e qualidade de vida em Jundiaí. Lazer completo, áreas verdes e portaria 24 horas para a família toda. O Ecovillage I e o Ecovillage II dividem a mesma entrada.';
  const i = descricaoDoCondominio(texto, 'Ecovillage I');
  const ii = descricaoDoCondominio(texto, 'Ecovillage II');
  assert.notEqual(i, ii);
  assert.ok(i.startsWith('Ecovillage I: '), i);
  assert.ok(ii.startsWith('Ecovillage II: '), ii);
  assert.ok(i.length <= 155 && ii.length <= 155);
});

test('se o resumo já cita o nome, não repete', () => {
  const d = descricaoDoCondominio('O Eleve fica no Medeiros, com lazer completo e segurança 24 horas.', 'Eleve');
  assert.ok(d.startsWith('O Eleve fica no Medeiros'), d);
});
