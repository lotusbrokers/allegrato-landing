import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configuracaoPadrao, validarConfiguracao } from './utm/configuracao.ts';
import { gerarDinamico, gerarEstatico, valoresDoRegistro } from './utm/gerador.ts';
import { analisarUrl, codificarValor, montarUrl, problemasDeMacro, resolverMacros, textoDosParametros, urlComParametrosDaMeta } from './utm/url.ts';

const analisada = (url: string) => {
  const r = analisarUrl(url);
  if (!r.ok) throw new Error(r.erro);
  return r.url;
};

test('valida a URL de destino: só http e https, com domínio completo', () => {
  assert.equal(analisarUrl('https://www.lotusbrokers.com.br/allegrato').ok, true);
  assert.equal(analisarUrl('').ok, false);
  assert.equal(analisarUrl('www.lotusbrokers.com.br').ok, false);
  assert.equal(analisarUrl('javascript:alert(1)').ok, false);
  assert.equal(analisarUrl('ftp://lotusbrokers.com.br/x').ok, false);
  assert.equal(analisarUrl('https://localhost/x').ok, false);
  assert.equal(analisarUrl('https://www.lotusbrokers.com.br/a b').ok, false);
});

test('o padrão dinâmico sai com as macros intactas', () => {
  assert.equal(
    gerarDinamico(configuracaoPadrao(), undefined).parametros,
    'utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}',
  );
  assert.equal(codificarValor('lotus_{{ad.id}} final'), 'lotus_{{ad.id}}%20final');
});

test('preserva parâmetros existentes, a ordem e o fragmento', () => {
  const r = montarUrl(analisada('https://www.lotusbrokers.com.br/vigore?c=AB12&gclid=x%2By#plantas'), [
    { chave: 'utm_source', valor: 'instagram' },
    { chave: 'utm_medium', valor: 'paid_social' },
  ]);
  assert.equal(r.url, 'https://www.lotusbrokers.com.br/vigore?c=AB12&gclid=x%2By&utm_source=instagram&utm_medium=paid_social#plantas');
  assert.deepEqual(r.conflitos, []);
});

test('não duplica parâmetro igual e não sobrescreve conflito em silêncio', () => {
  const destino = analisada('https://www.lotusbrokers.com.br/vigore?utm_medium=paid_social&utm_source=facebook');
  const r = montarUrl(destino, [
    { chave: 'utm_medium', valor: 'paid_social' },
    { chave: 'utm_source', valor: 'instagram' },
  ]);
  assert.deepEqual(r.jaPresentes, ['utm_medium']);
  assert.deepEqual(r.conflitos, [{ chave: 'utm_source', atual: 'facebook', novo: 'instagram' }]);
  assert.equal(r.url, 'https://www.lotusbrokers.com.br/vigore?utm_medium=paid_social&utm_source=facebook');
  const trocado = montarUrl(destino, [{ chave: 'utm_source', valor: 'instagram' }], ['utm_source']);
  assert.equal(trocado.url, 'https://www.lotusbrokers.com.br/vigore?utm_medium=paid_social&utm_source=instagram');
});

test('acentos, espaços e caracteres especiais são codificados no valor fixo', () => {
  assert.equal(textoDosParametros([{ chave: 'utm_campaign', valor: 'Lançamento Jundiaí & região/2026' }]), 'utm_campaign=Lan%C3%A7amento%20Jundia%C3%AD%20%26%20regi%C3%A3o%2F2026');
});

test('prévia do link como a Meta monta: ? ou &, antes do fragmento', () => {
  assert.equal(urlComParametrosDaMeta('https://x.com.br/a', 'utm_source=fb'), 'https://x.com.br/a?utm_source=fb');
  assert.equal(urlComParametrosDaMeta('https://x.com.br/a?c=1#topo', 'utm_source=fb'), 'https://x.com.br/a?c=1&utm_source=fb#topo');
});

test('macro estragada é detectada; macro boa não', () => {
  assert.deepEqual(problemasDeMacro('{{campaign.name}}'), []);
  assert.match(problemasDeMacro('%7B%7Bcampaign.name%7D%7D').join(), /codificada/);
  assert.match(problemasDeMacro('{{campaign.name}').join(), /sem par/);
  assert.match(problemasDeMacro('{{campaign_name}}').join(), /desconhecida/);
});

test('modo estático troca só o que se conhece e não inventa a origem', () => {
  const dados = { campanhaId: '1201', campanhaNome: 'Vigore Outubro', conjuntoNome: 'Jundiaí 25-45', anuncioNome: 'Carrossel 1' };
  assert.deepEqual(resolverMacros('{{campaign.name}}', valoresDoRegistro(dados)), { valor: 'Vigore Outubro', semValor: [] });

  const semOrigem = gerarEstatico(configuracaoPadrao(), 'https://www.lotusbrokers.com.br/vigore', valoresDoRegistro(dados));
  assert.equal(semOrigem.url, null);
  assert.deepEqual(semOrigem.faltando, [{ chave: 'utm_source', macros: ['site_source_name'] }]);

  const comOrigem = gerarEstatico(configuracaoPadrao(), 'https://www.lotusbrokers.com.br/vigore', valoresDoRegistro(dados), { utm_source: 'instagram' });
  assert.equal(
    comOrigem.url,
    'https://www.lotusbrokers.com.br/vigore?utm_source=instagram&utm_medium=paid_social&utm_campaign=Vigore%20Outubro&utm_content=Carrossel%201&utm_term=Jundia%C3%AD%2025-45',
  );
});

test('modo estático com UTM já na URL só gera link depois da decisão', () => {
  const dados = { campanhaNome: 'Vigore', conjuntoNome: 'C', anuncioNome: 'A' };
  const destino = 'https://www.lotusbrokers.com.br/vigore?utm_medium=cpc';
  const pendente = gerarEstatico(configuracaoPadrao(), destino, valoresDoRegistro(dados), { utm_source: 'fb' });
  assert.equal(pendente.url, null);
  assert.deepEqual(pendente.conflitos, [{ chave: 'utm_medium', atual: 'cpc', novo: 'paid_social' }]);
  const mantido = gerarEstatico(configuracaoPadrao(), destino, valoresDoRegistro(dados), { utm_source: 'fb' }, { substituir: [], manter: ['utm_medium'] });
  assert.match(mantido.url ?? '', /\?utm_medium=cpc&utm_source=fb&utm_campaign=Vigore/);
  const trocado = gerarEstatico(configuracaoPadrao(), destino, valoresDoRegistro(dados), { utm_source: 'fb' }, { substituir: ['utm_medium'], manter: [] });
  assert.match(trocado.url ?? '', /\?utm_medium=paid_social&utm_source=fb/);
});

test('modo dinâmico avisa UTM que já está na URL de destino', () => {
  const r = gerarDinamico(configuracaoPadrao(), 'https://www.lotusbrokers.com.br/vigore?utm_source=site');
  assert.deepEqual(r.conflitosNaUrl, [{ chave: 'utm_source', atual: 'site', novo: '{{site_source_name}}' }]);
  assert.equal(gerarDinamico(configuracaoPadrao(), 'nao-e-url').erro?.length ? true : false, true);
});

test('configuração inválida não passa', () => {
  const base = configuracaoPadrao();
  assert.equal(validarConfiguracao(base).ok, true);
  const ruim = validarConfiguracao({ ...base, parametros: [{ chave: 'UTM Source', valor: '{{campaign_name}}', obrigatorio: true }], categorias: [] });
  assert.equal(ruim.ok, false);
  if (!ruim.ok) {
    assert.match(ruim.erros.join(' | '), /Nome de parâmetro inválido/);
    assert.match(ruim.erros.join(' | '), /macro desconhecida/);
    assert.match(ruim.erros.join(' | '), /utm_medium/);
    assert.match(ruim.erros.join(' | '), /ao menos uma categoria/);
  }
});
