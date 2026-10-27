import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVE_DO_CODIGO,
  GENERICO_DO_CARTAO,
  codigoDaUrl,
  codigoDaVisita,
  quemApareceNoCartao,
  trechoDoCorretor,
} from './corretor-do-link.ts';

function memoria(inicial: Record<string, string> = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
  };
}

test('codigoDaUrl: só aceita o formato do banco', () => {
  assert.equal(codigoDaUrl('?c=k7m2qx'), 'k7m2qx');
  assert.equal(codigoDaUrl('?c=K7M2QX'), 'k7m2qx', 'maiúsculas viram minúsculas');
  assert.equal(codigoDaUrl('?utm_source=whatsapp&c=k7m2qx&x=1'), 'k7m2qx', 'no meio de outros parâmetros');
  assert.equal(codigoDaUrl('?c=XYZ!!'), null);
  assert.equal(codigoDaUrl('?c='), null);
  assert.equal(codigoDaUrl(''), null, 'sem query string');
  assert.equal(codigoDaUrl('?x=k7m2qx'), null, 'outro parâmetro não conta');
  assert.equal(codigoDaUrl('?c=k7m2q'), null, 'curto');
  assert.equal(codigoDaUrl('?c=k7m2qxa'), null, 'longo');
  assert.equal(codigoDaUrl('?c=k7m2q0'), null, 'zero não existe no alfabeto');
  assert.equal(codigoDaUrl('?c=k7m2ql'), null, 'l não existe no alfabeto');
});

test('codigoDaVisita: a URL vence e fica guardada para a aba', () => {
  const s = memoria({ [CHAVE_DO_CODIGO]: 'aaaaaa' });
  assert.equal(codigoDaVisita('?c=k7m2qx', s), 'k7m2qx');
  assert.equal(s.dados.get(CHAVE_DO_CODIGO), 'k7m2qx');
  // outro imóvel na mesma aba, sem ?c
  assert.equal(codigoDaVisita('', s), 'k7m2qx');
  // código inválido na URL não apaga o guardado
  assert.equal(codigoDaVisita('?c=XYZ!!', s), 'k7m2qx');
});

test('codigoDaVisita: aba nova, guardado adulterado e armazenamento bloqueado', () => {
  assert.equal(codigoDaVisita('', memoria()), null);
  assert.equal(codigoDaVisita('', memoria({ [CHAVE_DO_CODIGO]: '<script>' })), null);
  assert.equal(codigoDaVisita('?c=k7m2qx', null), 'k7m2qx');
  const bloqueado = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('SecurityError');
    },
  };
  assert.equal(codigoDaVisita('?c=k7m2qx', bloqueado), 'k7m2qx');
  assert.equal(codigoDaVisita('', bloqueado), null);
});

test('trechoDoCorretor: com e sem o nome, sempre com o marcador que a Lia procura', () => {
  assert.equal(trechoDoCorretor('k7m2qx', 'Mariana Mamede'), ' com Mariana Mamede (código do corretor: k7m2qx)');
  assert.equal(trechoDoCorretor('k7m2qx', null), ' (código do corretor: k7m2qx)');
  assert.equal(
    `Vim pela página do imóvel AP677 (Apartamento) e quero agendar uma visita${trechoDoCorretor('k7m2qx', 'Mariana Mamede')}.`,
    'Vim pela página do imóvel AP677 (Apartamento) e quero agendar uma visita com Mariana Mamede (código do corretor: k7m2qx).',
  );
  // o padrão que a Parte C pede à Lia acha o código no texto
  const lia = /código do corretor:\s*([a-z2-9]{6})/i;
  assert.equal(lia.exec(trechoDoCorretor('k7m2qx'))?.[1], 'k7m2qx');
});

test('quemApareceNoCartao: o corretor do link, depois o captador, depois o genérico', () => {
  const mariana = { nome: 'Mariana Mamede', foto: '/corretores/mariana-mamede.jpg', especialidades: null };
  const gabriele = { nome: 'Gabriele Fávaro', foto: '/corretores/gabriele-favaro.jpg', especialidades: ['Casa'] };
  assert.deepEqual(quemApareceNoCartao(mariana, gabriele), mariana, 'o link vence o captador');
  assert.deepEqual(quemApareceNoCartao(null, gabriele), gabriele, 'sem ?c=, ou com um código que não resolve');
  assert.deepEqual(quemApareceNoCartao(null, null), GENERICO_DO_CARTAO);
  assert.deepEqual(GENERICO_DO_CARTAO, { nome: 'Especialista Lotus', foto: null, especialidades: null }, 'o genérico não tem especialidade: fica o bairro');
});
