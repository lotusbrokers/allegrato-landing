import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { GENERICO_DO_CARTAO, quemApareceNoCartao } from './corretor-do-link';

// Um PostgREST de mentira: responde por view e anota o que foi pedido. O
// cliente do Supabase lê a URL quando lib/supabase.ts carrega, por isso
// lib/brokers.ts só é importado depois de o servidor subir.
type Resposta = { status: number; corpo: unknown };
let respostas: Record<string, Resposta> = {};
let pedidos: URL[] = [];
const servidor = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://local');
  pedidos.push(url);
  const r = respostas[url.pathname.split('/').pop() ?? ''] ?? { status: 200, corpo: [] };
  res.writeHead(r.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(r.corpo));
});

let brokers: typeof import('./brokers');

before(async () => {
  await new Promise<void>((pronto) => servidor.listen(0, '127.0.0.1', pronto));
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'chave-anonima-de-teste';
  process.env.NEXT_PUBLIC_TENANT_ID = 'lotus';
  brokers = await import('./brokers');
});

after(() => {
  servidor.close();
});

function cenario(r: Record<string, Resposta>) {
  respostas = r;
  pedidos = [];
}

test('getCaptadorDoImovel: lê captador_id numa consulta própria e o nome em portal_brokers', async () => {
  cenario({
    portal_imoveis: { status: 200, corpo: [{ captador_id: 'id-da-gabriele' }] },
    portal_brokers: { status: 200, corpo: [{ name: 'Gabriele  Fávaro', photo_url: null }] },
  });
  assert.deepEqual(await brokers.getCaptadorDoImovel('CA0063'), {
    nome: 'Gabriele Fávaro',
    foto: '/corretores/gabriele-favaro.jpg',
  });
  const [imovel, broker] = pedidos;
  assert.equal(imovel.pathname, '/rest/v1/portal_imoveis');
  assert.equal(imovel.searchParams.get('select'), 'captador_id', 'só a coluna nova, fora do SELECT_FULL');
  assert.equal(imovel.searchParams.get('codigo_imovel'), 'eq.CA0063');
  assert.equal(imovel.searchParams.get('tenant_id'), 'eq.lotus');
  assert.equal(broker.pathname, '/rest/v1/portal_brokers');
  assert.equal(broker.searchParams.get('id'), 'eq.id-da-gabriele');
  assert.equal(broker.searchParams.get('tenant_id'), 'eq.lotus');
});

test('getCaptadorDoImovel: a foto do banco vence a local', async () => {
  cenario({
    portal_imoveis: { status: 200, corpo: [{ captador_id: 'id-da-gabriele' }] },
    portal_brokers: { status: 200, corpo: [{ name: 'Gabriele Fávaro', photo_url: 'https://cdn/gabi.jpg' }] },
  });
  assert.deepEqual(await brokers.getCaptadorDoImovel('CA0063'), { nome: 'Gabriele Fávaro', foto: 'https://cdn/gabi.jpg' });
});

test('getCaptadorDoImovel: o captador oculto cai no genérico', async () => {
  cenario({
    portal_imoveis: { status: 200, corpo: [{ captador_id: 'id-do-samir' }] },
    portal_brokers: { status: 200, corpo: [{ name: 'Samir  Said', photo_url: null }] },
  });
  const captador = await brokers.getCaptadorDoImovel('AP0001');
  assert.equal(captador, null);
  assert.deepEqual(quemApareceNoCartao(null, captador), GENERICO_DO_CARTAO);
});

test('getCaptadorDoImovel: sem captador ou fora de portal_brokers, null', async () => {
  cenario({ portal_imoveis: { status: 200, corpo: [{ captador_id: null }] } });
  assert.equal(await brokers.getCaptadorDoImovel('AP0001'), null);
  assert.equal(pedidos.length, 1, 'sem captador, nem pergunta a portal_brokers');

  cenario({
    portal_imoveis: { status: 200, corpo: [{ captador_id: 'id-da-diretoria' }] },
    portal_brokers: { status: 200, corpo: [] },
  });
  assert.equal(await brokers.getCaptadorDoImovel('AP0001'), null);
});

test('getCaptadorDoImovel: a falha da leitura devolve null (o site antes da migration 20261176)', async (t) => {
  const erros = t.mock.method(console, 'error', () => {});
  cenario({
    portal_imoveis: {
      status: 400,
      corpo: { code: '42703', message: 'column portal_imoveis.captador_id does not exist', details: null, hint: null },
    },
  });
  assert.equal(await brokers.getCaptadorDoImovel('CA0063'), null);
  assert.equal(pedidos.length, 1);
  assert.match(String(erros.mock.calls[0]?.arguments[1]), /captador_id does not exist/);

  cenario({
    portal_imoveis: { status: 200, corpo: [{ captador_id: 'id-da-gabriele' }] },
    portal_brokers: { status: 401, corpo: { code: '42501', message: 'permission denied for view portal_brokers' } },
  });
  assert.equal(await brokers.getCaptadorDoImovel('CA0063'), null);
});

test('getBrokerDoLink: a mesma limpeza do nome e o mesmo oculto', async () => {
  cenario({ portal_brokers: { status: 200, corpo: [{ name: 'Mariana  Mamede', photo_url: null }] } });
  assert.deepEqual(await brokers.getBrokerDoLink('k7m2qx'), { nome: 'Mariana Mamede', foto: '/corretores/mariana-mamede.jpg' });
  assert.equal(pedidos[0].searchParams.get('codigo_link'), 'eq.k7m2qx');

  cenario({ portal_brokers: { status: 200, corpo: [{ name: 'Alex  Xavier da Silva', photo_url: null }] } });
  assert.equal(await brokers.getBrokerDoLink('k7m2qx'), null);
});
