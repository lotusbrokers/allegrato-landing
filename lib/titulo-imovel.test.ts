import assert from 'node:assert/strict';
import { test } from 'node:test';
import { precoDoTitulo, tituloDaPdp } from './titulo-imovel.ts';

const ap0684 = {
  titulo: 'Apartamento à venda em Jundiaí - Reserva do Japy  -  AU 50 m² - 2 quartos- R$310.000,00',
  tipo_simplificado: 'Apartamento',
  tipo: 'Apartamento Padrão',
  quartos: 2,
  bairro: 'Reserva do Japy',
  cidade: 'Jundiaí',
  valor_venda: 310000,
  valor_locacao: null,
};

test('preço entra uma vez, formatado, e o título do feed é ignorado', () => {
  const t = tituloDaPdp(ap0684);
  assert.equal(t, 'Apartamento com 2 quartos em Reserva do Japy | R$ 310.000 | Lotus Brokers');
  assert.equal((t.match(/R\$/g) || []).length, 1);
  assert.ok(!t.includes('310.000,00'));
});

test('tipo em minúsculas no feed sai capitalizado', () => {
  // Caso real (AP0684): tipo_simplificado "apartamento", bairro comprido.
  const t = tituloDaPdp({ tipo_simplificado: 'apartamento', tipo: 'Apartamento', quartos: 2, bairro: 'Recanto Quarto Centenário', cidade: 'Jundiaí', valor_venda: 310000 });
  assert.equal(t, 'Apartamento 2 quartos em Recanto Quarto Centenário | R$ 310.000 | Lotus Brokers');
  assert.equal(tituloDaPdp({ tipo_simplificado: 'casa', tipo: 'Sobrado', quartos: 4, bairro: 'Malota', cidade: 'Jundiaí', valor_venda: 2150000 }), 'Casa com 4 quartos em Malota, Jundiaí | R$ 2.150.000 | Lotus Brokers');
});

test('a parte antes da marca cabe em ~60 caracteres, encurtando na ordem certa', () => {
  const t = tituloDaPdp(ap0684);
  assert.ok(t.replace(' | Lotus Brokers', '').length <= 65, t);
  // Cidade cabendo, ela fica.
  assert.equal(tituloDaPdp({ ...ap0684, bairro: 'Centro' }), 'Apartamento com 2 quartos em Centro, Jundiaí | R$ 310.000 | Lotus Brokers');
  // Bairro comprido: sai a cidade, depois o "com", depois o bairro.
  const longo = tituloDaPdp({ ...ap0684, tipo_simplificado: 'Casa em condomínio', bairro: 'Residencial Jardim das Flores do Alto da Serra' });
  assert.equal(longo, 'Casa em condomínio 2 quartos em Jundiaí | R$ 310.000 | Lotus Brokers');
});

test('campo ausente não deixa vírgula, hífen nem "com" sobrando', () => {
  assert.equal(tituloDaPdp({ tipo_simplificado: 'Terreno', bairro: 'Medeiros', cidade: 'Jundiaí', valor_venda: 250000 }), 'Terreno em Medeiros, Jundiaí | R$ 250.000 | Lotus Brokers');
  assert.equal(tituloDaPdp({ tipo_simplificado: 'Apartamento', quartos: 3, cidade: 'Itupeva' }), 'Apartamento com 3 quartos em Itupeva | Lotus Brokers');
  assert.equal(tituloDaPdp({ quartos: 1, valor_venda: 180000 }), 'Imóvel com 1 quarto | R$ 180.000 | Lotus Brokers');
  assert.equal(tituloDaPdp({}), 'Imóvel | Lotus Brokers');
});

test('locação usa o valor de locação com /mês; venda tem prioridade', () => {
  assert.equal(precoDoTitulo({ valor_locacao: 2500 }), 'R$ 2.500/mês');
  assert.equal(precoDoTitulo({ valor_venda: 310000, valor_locacao: 2500 }), 'R$ 310.000');
  assert.equal(precoDoTitulo({ valor_venda: 0, valor_locacao: null }), '');
});
