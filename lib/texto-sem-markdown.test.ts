import assert from 'node:assert/strict';
import { test } from 'node:test';
import { textoSemMarkdown } from './texto-sem-markdown.ts';

// Casos tirados das descrições que estavam no ar em 10/11/2026.
test('título e negrito saem, e o título vira frase', () => {
  assert.equal(
    textoSemMarkdown('## Condomínio Chácara das Flores – Conforto e segurança em Jundiaí\nImagine viver em um condomínio **arborizado**.'),
    'Condomínio Chácara das Flores – Conforto e segurança em Jundiaí. Imagine viver em um condomínio arborizado.',
  );
  assert.equal(
    textoSemMarkdown('**Condomínio Bell’Acqua – Sofisticação em Jundiaí**\n\nViver no Condomínio Bell’Acqua é…'),
    'Condomínio Bell’Acqua – Sofisticação em Jundiaí. Viver no Condomínio Bell’Acqua é…',
  );
});

test('listas, links e negrito sem par perdem a marcação', () => {
  assert.equal(textoSemMarkdown('Lazer:\n- Piscina\n- Academia\n1. Quadra'), 'Lazer: Piscina. Academia. Quadra');
  assert.equal(textoSemMarkdown('Veja o [mapa](https://x.y) e **o resto'), 'Veja o mapa e o resto');
});

test('texto sem markdown passa igual; asterisco de nota fica', () => {
  assert.equal(textoSemMarkdown('Unidade Garden de 62,8 m²* com 1 dormitório.'), 'Unidade Garden de 62,8 m²* com 1 dormitório.');
  assert.equal(textoSemMarkdown(null), '');
  assert.equal(textoSemMarkdown('  \n  '), '');
});
