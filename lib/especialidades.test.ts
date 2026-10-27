import assert from 'node:assert/strict';
import { test } from 'node:test';
import { especialidadesDoSite, especialistaEm, especialistaNoCartaoDoImovel } from './especialidades.ts';

// A lista aprovada pelo Erick em 21/10 (decisão do dono, 27/10).
const LISTA_DO_ERICK = [
  'Alto padrão',
  'Condomínios fechados',
  'Lotes e terrenos',
  'Primeiro imóvel (MCMV/FGTS)',
  'Comercial',
  'Investidor / compactos para renda',
  'Rural / chácaras',
];

test('cada especialidade sai como foi gravada, sem plural nem correção', () => {
  assert.deepEqual(especialidadesDoSite(LISTA_DO_ERICK), LISTA_DO_ERICK);
  assert.deepEqual(
    especialidadesDoSite(['Apartamento', 'Casa', 'Sala Comercial', 'casa']),
    ['Apartamento', 'Casa', 'Sala Comercial', 'casa'],
    'as gravadas antes da lista nova também',
  );
  assert.deepEqual(especialidadesDoSite([' Comercial ', '  ']), ['Comercial'], 'espaço sobrando sai; só espaço não conta');
});

test('lista em português: "A", "A e B", "A, B e C"', () => {
  assert.equal(especialistaEm(['Comercial'], '-'), 'Comercial');
  assert.equal(especialistaEm(['Alto padrão', 'Comercial'], '-'), 'Alto padrão e Comercial');
  assert.equal(
    especialistaEm(['Alto padrão', 'Condomínios fechados', 'Lotes e terrenos'], '-'),
    'Alto padrão, Condomínios fechados e Lotes e terrenos',
  );
  assert.equal(
    especialistaEm(['Apartamento', 'Cobertura', 'Casa', 'Terreno', 'Sala Comercial'], '-'),
    'Apartamento, Cobertura, Casa, Terreno e Sala Comercial',
    'fora do cartão do imóvel, todas',
  );
});

test('nenhuma (NULL, vazia ou só espaços): o texto de antes', () => {
  assert.equal(especialistaEm(null, 'Jundiaí e Itupeva'), 'Jundiaí e Itupeva');
  assert.equal(especialistaEm(undefined, 'Jundiaí e Itupeva'), 'Jundiaí e Itupeva');
  assert.equal(especialistaEm([], 'Jundiaí e Itupeva'), 'Jundiaí e Itupeva');
  assert.equal(especialistaNoCartaoDoImovel(null, 'Jardim Ermida II'), 'Jardim Ermida II');
  assert.equal(especialistaNoCartaoDoImovel([' ', ''], 'Jardim Ermida II'), 'Jardim Ermida II');
});

test('cartão do imóvel: as 3 primeiras, na ordem gravada', () => {
  assert.equal(
    especialistaNoCartaoDoImovel(['Alto padrão', 'Comercial', 'Rural / chácaras'], 'Jardim Ermida II'),
    'Alto padrão, Comercial e Rural / chácaras',
  );
  assert.equal(
    especialistaNoCartaoDoImovel(LISTA_DO_ERICK.slice(0, 5), 'Jardim Ermida II'),
    'Alto padrão, Condomínios fechados e Lotes e terrenos',
  );
  assert.equal(especialistaNoCartaoDoImovel(['  ', 'Comercial', 'Alto padrão'], 'Centro'), 'Comercial e Alto padrão', 'o vazio não ocupa vaga');
});
