import assert from 'node:assert/strict';
import { test } from 'node:test';
import { descricaoDoCondominio, tituloDoCondominio } from './metadados-condominio.ts';

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
