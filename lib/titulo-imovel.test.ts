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
  assert.equal(t, 'Apartamento com 2 quartos em Reserva do Japy, Jundiaí | R$ 310.000');
  assert.equal((t.match(/R\$/g) || []).length, 1);
  assert.ok(!t.includes('310.000,00'));
});

test('tipo em minúsculas no feed sai capitalizado', () => {
  // Caso real (AP0684): tipo_simplificado "apartamento", bairro comprido.
  const t = tituloDaPdp({ tipo_simplificado: 'apartamento', tipo: 'Apartamento', quartos: 2, bairro: 'Recanto Quarto Centenário', cidade: 'Jundiaí', valor_venda: 310000 });
  assert.equal(t, 'Apartamento em Recanto Quarto Centenário, Jundiaí | R$ 310.000');
  assert.equal(tituloDaPdp({ tipo_simplificado: 'casa', tipo: 'Sobrado', quartos: 4, bairro: 'Malota', cidade: 'Jundiaí', valor_venda: 2150000 }), 'Casa com 4 quartos em Malota, Jundiaí | R$ 2.150.000 | Lotus Brokers');
});

// Auditoria do site (13/11/2026): "Título até 70 caracteres, com a cidade". O
// AP0693 saía com 78 caracteres e sem Jundiaí.
test('o título inteiro cabe em 70 caracteres e a cidade nunca sai', () => {
  const ap0693 = { tipo_simplificado: 'Apartamento', quartos: 4, bairro: 'Jardim Bonfiglioli', cidade: 'Jundiaí', valor_venda: 2000000 };
  assert.equal(tituloDaPdp(ap0693), 'Apartamento 4 quartos em Jardim Bonfiglioli, Jundiaí | R$ 2.000.000');
  // Ordem dos cortes: primeiro o "com", depois a marca, depois os quartos...
  assert.equal(tituloDaPdp({ ...ap0684, bairro: 'Centro' }), 'Apartamento 2 quartos em Centro, Jundiaí | R$ 310.000 | Lotus Brokers');
  // ...e por último o bairro, que leva de volta os quartos e a marca se couberem.
  const longo = tituloDaPdp({ ...ap0684, tipo_simplificado: 'Casa em condomínio', bairro: 'Residencial Jardim das Flores do Alto da Serra' });
  assert.equal(longo, 'Casa em condomínio 2 quartos em Jundiaí | R$ 310.000 | Lotus Brokers');
  for (const t of [tituloDaPdp(ap0684), tituloDaPdp(ap0693), longo]) {
    assert.ok(t.length <= 70, t);
    assert.ok(t.includes('Jundiaí'), t);
  }
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
