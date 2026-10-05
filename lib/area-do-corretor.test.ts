// Partes puras da Área do Corretor (lib/area-do-corretor/). Fica na raiz de lib/
// porque o `npm test` roda lib/*.test.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinoSeguro, melhorPapel, podeGerenciar, temAcesso, ROTA_BASE } from './area-do-corretor/acesso.ts';
import { buscar, normalizar, type ItemDeBusca } from './area-do-corretor/busca.ts';
import { linkDoImovel, linkDoLancamento, linkWhatsApp } from './area-do-corretor/compartilhar.ts';
import { comAcessoRegistrado, comFavoritoAlternado, interpretar, type ItemSalvo } from './area-do-corretor/memoria-local.ts';
import {
  arquivoSensivel,
  ficaDeFora,
  iconeDaPasta,
  maisParecido,
  nomeLimpo,
  ordemDaPasta,
  semelhanca,
  subpastaRepetida,
  tipoDeArquivo,
} from './area-do-corretor/drive-regras.ts';
import { filtrarImoveis, filtrarLancamentos, lerFiltros, medidasDoLancamento, rotuloDeValor, temFiltro } from './area-do-corretor/filtros.ts';
import { mapaDosLancamentos } from './area-do-corretor/secoes.ts';

test('acesso: só os papéis de quem vende entram; financeiro e desconhecidos não', () => {
  for (const papel of ['owner', 'admin', 'team_leader', 'corretor']) assert.equal(temAcesso(papel), true, papel);
  for (const papel of ['financeiro', '', null, undefined, 'Corretor']) assert.equal(temAcesso(papel), false, String(papel));
});

test('acesso: entre vários vínculos vale o de maior alcance', () => {
  assert.equal(melhorPapel(['corretor', 'admin']), 'admin');
  assert.equal(melhorPapel(['financeiro', 'team_leader']), 'team_leader');
  assert.equal(melhorPapel(['financeiro']), null);
  assert.equal(melhorPapel([]), null);
});

test('acesso: só owner e admin gerenciam', () => {
  assert.equal(podeGerenciar('owner'), true);
  assert.equal(podeGerenciar('admin'), true);
  assert.equal(podeGerenciar('team_leader'), false);
  assert.equal(podeGerenciar('corretor'), false);
});

test('acesso: depois do login só volta para dentro da área', () => {
  assert.equal(destinoSeguro('/area-do-corretor/lancamentos/gioviale'), '/area-do-corretor/lancamentos/gioviale');
  assert.equal(destinoSeguro('/area-do-corretor/terceiros?tipo=Casa'), '/area-do-corretor/terceiros?tipo=Casa');
  assert.equal(destinoSeguro('/area-do-corretor'), ROTA_BASE);
  // Tudo o mais cai na home da área: outro site, protocolo relativo, barra invertida,
  // um prefixo parecido e a própria tela de entrada (que viraria um laço).
  for (const ruim of [
    null,
    '',
    'https://golpe.example.com',
    '//golpe.example.com/area-do-corretor',
    '/area-do-corretor-falsa',
    '/area-do-corretor\\..\\..\\golpe',
    '/lotus-busca',
    '/area-do-corretor/entrar',
    '/area-do-corretor/entrar?volta=/area-do-corretor',
  ]) {
    assert.equal(destinoSeguro(ruim), ROTA_BASE, String(ruim));
  }
});

const indice: ItemDeBusca[] = [
  { tipo: 'secao', titulo: 'Marketing', detalhe: 'Posts, stories, reels e campanhas', href: '/area-do-corretor/marketing', termos: 'posts stories reels whatsapp' },
  { tipo: 'lancamento', titulo: 'Reserva di Medeiros', detalhe: 'Medeiros · Jundiaí · MRV', href: '/a/1', termos: '2 dorms lancamento' },
  { tipo: 'construtora', titulo: 'Santa Angela', detalhe: '3 lançamentos', href: '/a/2', termos: 'Gioviale Medeiros Jundiaí' },
  { tipo: 'imovel', titulo: 'Apartamento · Medeiros', detalhe: 'Jundiaí · R$ 790.000 · cód. 123', href: '/a/3', termos: '123 3 dormitorios venda terceiros' },
  { tipo: 'imovel', titulo: 'Casa · Engordadouro', detalhe: 'Jundiaí · R$ 1.200.000 · cód. 456', href: '/a/4', termos: '456 venda terceiros' },
];

test('busca: sem acento e sem diferenciar maiúsculas', () => {
  assert.equal(normalizar('  Jundiaí   ÁREA '), 'jundiai area');
  assert.deepEqual(buscar(indice, 'JUNDIAI').map((i) => i.href).length, 4);
});

test('busca: "Medeiros" acha lançamento, construtora e imóvel do bairro, com o título casado na frente', () => {
  const achados = buscar(indice, 'medeiros').map((i) => i.titulo);
  assert.deepEqual(achados, ['Reserva di Medeiros', 'Apartamento · Medeiros', 'Santa Angela']);
});

test('busca: todos os termos precisam aparecer; vazio não traz nada', () => {
  assert.deepEqual(buscar(indice, 'apartamento medeiros').map((i) => i.href), ['/a/3']);
  assert.deepEqual(buscar(indice, 'casa medeiros'), []);
  assert.deepEqual(buscar(indice, '   '), []);
  assert.deepEqual(buscar(indice, 'cód. 456').map((i) => i.href), ['/a/4']);
  assert.equal(buscar(indice, 'a', 2).length, 2);
});

test('compartilhar: links públicos no domínio oficial e texto do WhatsApp codificado', () => {
  assert.equal(linkDoImovel('AP 12/3'), 'https://www.lotusbrokers.com.br/lotus-imovel/AP%2012%2F3');
  assert.equal(linkDoLancamento('/gioviale'), 'https://www.lotusbrokers.com.br/gioviale');
  // Sem landing própria, a vitrine de lançamentos, e não uma página que não existe.
  assert.equal(linkDoLancamento(null), 'https://www.lotusbrokers.com.br/lotus-lancamentos');
  assert.equal(
    linkWhatsApp('Gioviale & cia', 'https://www.lotusbrokers.com.br/gioviale'),
    'https://wa.me/?text=Gioviale%20%26%20cia%0Ahttps%3A%2F%2Fwww.lotusbrokers.com.br%2Fgioviale',
  );
});

const item = (n: number): ItemSalvo => ({ chave: `imovel:${n}`, tipo: 'imovel', titulo: `Imóvel ${n}`, detalhe: '', href: `/area-do-corretor/terceiros/${n}` });

test('favoritos: alterna, entra no topo e não repete', () => {
  let lista = comFavoritoAlternado([], item(1));
  lista = comFavoritoAlternado(lista, item(2));
  assert.deepEqual(lista.map((i) => i.chave), ['imovel:2', 'imovel:1']);
  lista = comFavoritoAlternado(lista, item(1));
  assert.deepEqual(lista.map((i) => i.chave), ['imovel:2']);
});

test('recentes: o último acesso sobe para o topo, sem duplicar, até 8', () => {
  let lista: ItemSalvo[] = [];
  for (let n = 1; n <= 10; n++) lista = comAcessoRegistrado(lista, item(n));
  lista = comAcessoRegistrado(lista, item(5));
  assert.equal(lista.length, 8);
  assert.equal(lista[0].chave, 'imovel:5');
  assert.equal(lista.filter((i) => i.chave === 'imovel:5').length, 1);
});

test('memória local: dado corrompido ou adulterado vira lista vazia ou é filtrado', () => {
  assert.deepEqual(interpretar('não é json'), []);
  assert.deepEqual(interpretar('{"a":1}'), []);
  // href externo não entra, nem disfarçado de caminho: a lista só leva para dentro da área.
  const fora = (href: string) => ({ chave: href, titulo: 'Fora', href, tipo: 'imovel', detalhe: '' });
  const misturado = JSON.stringify([item(1), fora('https://golpe.example.com'), fora('//golpe.example.com'), fora('/lotus-busca'), 42]);
  assert.deepEqual(interpretar(misturado).map((i) => i.chave), ['imovel:1']);
});

/* ---------- Google Drive: nomes reais da pasta "1. Corretores" (05/10/2026) ---------- */

test('drive: arquivo com senha nunca aparece', () => {
  assert.equal(arquivoSensivel('Senhas portais.xlsx'), true);
  assert.equal(arquivoSensivel('SENHA do portal'), true);
  assert.equal(arquivoSensivel('Credenciais.docx'), true);
  assert.equal(arquivoSensivel('Book Trend.pdf'), false);
  assert.equal(arquivoSensivel('Planilha Lançamentos'), false);
});

test('drive: nome sem numeração nem sufixo de zip; ordem pela numeração', () => {
  assert.equal(nomeLimpo('2. LANÇAMENTOS'), 'LANÇAMENTOS');
  assert.equal(nomeLimpo('Vivart Grand Alamedas-20260917T152753Z-1-001'), 'Vivart Grand Alamedas');
  assert.equal(nomeLimpo('Livros'), 'Livros');
  assert.equal(ordemDaPasta('1. PRONTOS'), 1);
  assert.equal(ordemDaPasta('6. PAUTAS DE REUNIÕES'), 6);
  assert.equal(ordemDaPasta('Livros'), Number.POSITIVE_INFINITY);
});

test('drive: tipo do arquivo pelo mimeType ou pela extensão', () => {
  assert.equal(tipoDeArquivo('application/vnd.google-apps.folder', 'Odeon'), 'pasta');
  assert.equal(tipoDeArquivo('application/pdf', 'BOOK.pdf'), 'pdf');
  assert.equal(tipoDeArquivo('application/octet-stream', 'TABELA.PDF'), 'pdf');
  assert.equal(tipoDeArquivo('application/vnd.google-apps.spreadsheet', 'Planilha Lançamentos'), 'planilha');
  assert.equal(tipoDeArquivo('image/jpeg', 'fachada.jpg'), 'imagem');
  assert.equal(tipoDeArquivo('video/mp4', 'tour.mp4'), 'video');
  assert.equal(tipoDeArquivo('application/zip', 'fotos.zip'), 'arquivo');
});

test('drive: ícone pelo assunto da pasta', () => {
  assert.equal(iconeDaPasta('2. LANÇAMENTOS'), 'predio');
  assert.equal(iconeDaPasta('1. PRONTOS'), 'casa');
  assert.equal(iconeDaPasta('3. MARKETING'), 'megafone');
  assert.equal(iconeDaPasta('4. CURSOS E LIVROS'), 'documento');
  assert.equal(iconeDaPasta('6. PAUTAS DE REUNIÕES'), 'relogio');
  assert.equal(iconeDaPasta('Outubro'), 'pasta');
});

test('drive: construtora da Dashboard acha a pasta escrita de outro jeito', () => {
  for (const [dashboard, pasta] of [
    ['F A Oliva', 'FA Oliva'],
    ['MAC Lucer', 'MACLUCER'],
    ['REM', 'REM Incorporadora'],
    ['VVC Construtora', 'VVC'],
    ['Santa Angela', 'SANTA ANGELA'],
  ]) {
    assert.equal(semelhanca(dashboard, pasta), 1, `${dashboard} × ${pasta}`);
  }
  assert.ok(semelhanca('Trend', 'Trend Canadá') >= 0.9);
});

test('drive: empreendimento acha a pasta mesmo com erro de digitação', () => {
  assert.equal(semelhanca('Epic Jundiaí', 'EPIC'), 1);
  assert.equal(semelhanca('Best View Residence', 'Best View'), 1);
  assert.equal(semelhanca('Gran Ville Santo Angelo', 'GRANVILLE - SANTO ANGELO (ITUPEVA)'), 1);
  assert.ok(semelhanca('Vila Triunfo', 'Vila Trunfo') >= 0.8);
  assert.ok(semelhanca('Villaggio Engordadouro', 'Villagio Engordadouro') >= 0.9);
  assert.ok(semelhanca('Vivarte Grand Alamedas', 'Vivart Grand Alamedas-20260917T152753Z-1-001') >= 0.85);
});

test('drive: escolhe a pasta certa entre irmãs parecidas, e nenhuma quando não há', () => {
  const auten = [{ nome: 'Serrah' }, { nome: 'Auten Jundiaí' }, { nome: 'Terrace Serra do Japi' }];
  assert.equal(maisParecido('Auten Serrah', auten, 0.75)?.nome, 'Serrah');
  assert.equal(maisParecido('Auten Jundiaí', auten, 0.75)?.nome, 'Auten Jundiaí');
  assert.equal(maisParecido('Terrace Serra do Japi', auten, 0.75)?.nome, 'Terrace Serra do Japi');
  const faOliva = [{ nome: 'Vila Preciosa' }, { nome: 'Vila Trunfo' }, { nome: 'Odeon' }, { nome: 'Avalon' }];
  assert.equal(maisParecido('Vila Triunfo', faOliva, 0.75)?.nome, 'Vila Trunfo');
  // A Santa Angela guarda tudo numa pasta só: nenhum empreendimento casa, e a página usa a da construtora.
  assert.equal(maisParecido('Gioviale', [{ nome: 'SANTA ANGELA' }], 0.75), null);
});

/* ---------- Google Drive: pasta repetida e arquivos de sistema (Santa Angela, 05/10/2026) ---------- */

test('drive: arquivo de sistema fica de fora, material não', () => {
  for (const nome of ['.DS_Store', 'Thumbs.db', 'desktop.ini', '.~lock.tabela.xlsx#']) assert.equal(ficaDeFora(nome), true, nome);
  for (const nome of ['book.pdf', 'Treinamento Santa Angela + Japi.xlsx', 'OPORTUNIDADES - JULHO 2025 .pdf']) assert.equal(ficaDeFora(nome), false, nome);
  assert.equal(ficaDeFora('Senhas portais.xlsx'), true);
});

test('drive: "SANTA ANGELA / SANTA ANGELA" é pasta repetida; conteúdo de verdade não é', () => {
  const interna = { nome: 'SANTA ANGELA', pasta: true };
  assert.equal(subpastaRepetida('SANTA ANGELA', [interna]), interna);
  assert.equal(subpastaRepetida('Santa Angela', [{ nome: 'SANTA  ANGELA', pasta: true }])?.nome, 'SANTA  ANGELA');
  // Com qualquer outro conteúdo ao lado, ou com outro nome, a subpasta é conteúdo de verdade.
  assert.equal(subpastaRepetida('SANTA ANGELA', [interna, { nome: 'tabela.pdf', pasta: false }]), null);
  assert.equal(subpastaRepetida('Odeon', [{ nome: 'Plantas', pasta: true }]), null);
  assert.equal(subpastaRepetida('SANTA ANGELA', [{ nome: 'SANTA ANGELA.pdf', pasta: false }]), null);
});

test('drive: empreendimentos da Santa Angela acham as pastas da subpasta repetida', () => {
  const pastas = [
    'Allegratto', 'Altos da Avenida', 'Differenziato', 'FICHAS TECNICAS', 'GIOVIALE', 'JARDINS DO HORTO',
    'MAXX SANTA ANGELA', 'Portal Dos Lagos', 'RESERVA CASTANHEIRA', 'RESORT PRIME', 'SANTORINI', 'VIGORE',
  ].map((nome) => ({ nome }));
  for (const [dashboard, pasta] of [
    ['Allegrato', 'Allegratto'],
    ['Resort Prime', 'RESORT PRIME'],
    ['Santorini', 'SANTORINI'],
    ['Reserva Castanheira', 'RESERVA CASTANHEIRA'],
    ['Gioviale', 'GIOVIALE'],
    ['Altos da Avenida', 'Altos da Avenida'],
    ['Maxx Santa Angela', 'MAXX SANTA ANGELA'],
    ['Vigóre', 'VIGORE'],
    ['Portal dos Lagos', 'Portal Dos Lagos'],
    ['Jardins do Horto', 'JARDINS DO HORTO'],
  ]) {
    assert.equal(maisParecido(dashboard, pastas, 0.75)?.nome, pasta, dashboard);
  }
});

test('drive: lista de leads (dado de cliente) fica de fora; material de venda não', () => {
  for (const nome of ['z. Leads Plantão', 'LEADS INSTAGRAM.xlsx', 'Lead - visitas setembro.csv']) assert.equal(ficaDeFora(nome), true, nome);
  // "lead" só como palavra inteira: não esconde o que apenas contém as letras.
  for (const nome of ['Prospecção e captação', 'Planilha de oportunidades', 'Leadership.pdf', 'Pleads.pdf']) assert.equal(ficaDeFora(nome), false, nome);
});

// Textos de especificação como estavam no cadastro da Dashboard em 05/10/2026.
test('filtros: metragem e quartos saem do texto livre do cadastro', () => {
  const casos: [string, [number, number] | null, [number, number] | null][] = [
    ['55–64 m² · 2 dorms', [55, 64], [2, 2]],
    ['68–112 m² · 2 e 3 dorms', [68, 112], [2, 3]],
    ['53–85 m² · 2 ou 3 dorms', [53, 85], [2, 3]],
    ['157–203 m² · 3 e 4 suítes', [157, 203], [3, 4]],
    ['207 m² · 4 suítes · 4 vagas', [207, 207], [4, 4]],
    ['66–89,9 m² · 2 dorms com suíte · varanda grill', [66, 89.9], [2, 2]],
    ['56-71m 2 e 3 dorms', [56, 71], [2, 3]],
    ['43,78 m² a 46,14', [43.78, 46.14], null],
    ['69,79 e 113,95', [69.79, 113.95], null],
    ['78,5 m²  e   108 m²', [78.5, 108], null],
    ['26m² a 106', [26, 106], null],
    ['Lotes de 420 a 908 m²', [420, 908], null],
    ['Lotes a partir de 1.200 m2', [1200, 1200], null],
    ['2 e 3 dorms com suíte', null, [2, 3]],
    ['2 vagas por unidade', null, null],
    ['Loteamento fechado', null, null],
    ['', null, null],
  ];
  for (const [texto, area, quartos] of casos) {
    const m = medidasDoLancamento(texto);
    assert.deepEqual(m.area && [m.area.min, m.area.max], area, `área de "${texto}"`);
    assert.deepEqual(m.quartos && [m.quartos.min, m.quartos.max], quartos, `quartos de "${texto}"`);
  }
});

test('filtros: combinação E; quem não tem o dado filtrado fica de fora e é contado', () => {
  const itens = [
    { name: 'A', type: '', specs: '55–64 m² · 2 dorms', priceNum: 365_000 },
    { name: 'B', type: '', specs: '83–111 m² · 2 e 3 dorms', priceNum: 1_019_707 },
    { name: 'C', type: '', specs: '157–203 m² · 3 e 4 suítes', priceNum: 0 },
    { name: 'D', type: '', specs: '128–264 m²', priceNum: 884_000 },
  ];
  const nomes = (r: { itens: { name: string }[] }) => r.itens.map((i) => i.name);
  assert.deepEqual(nomes(filtrarLancamentos(itens, lerFiltros({}))), ['A', 'B', 'C', 'D']);
  // 3+ quartos: B (2 e 3) e C (3 e 4) passam; D não tem quartos no texto.
  assert.deepEqual(filtrarLancamentos(itens, lerFiltros({ quartos: '3' })), { itens: [itens[1], itens[2]], semDado: 1 });
  // A partir de 90 m²: vale a maior unidade.
  assert.deepEqual(nomes(filtrarLancamentos(itens, lerFiltros({ m2: '90' }))), ['B', 'C', 'D']);
  // Até R$ 1 milhão: C, sem valor no cadastro, fica de fora e é contado.
  assert.deepEqual(filtrarLancamentos(itens, lerFiltros({ valor: '1000000' })), { itens: [itens[0], itens[3]], semDado: 1 });
  assert.deepEqual(nomes(filtrarLancamentos(itens, lerFiltros({ quartos: '3', valor: '1500000' }))), ['B']);
});

test('filtros: imóveis de terceiros pelos números do cadastro; aluguel fora da busca por valor de venda', () => {
  const imoveis = [
    { codigo: 'AP1', beds: 2, area: 64, priceNum: 420_000, fin: 'comprar' as const },
    { codigo: 'CA1', beds: 3, area: 180, priceNum: 1_350_000, fin: 'comprar' as const },
    { codigo: 'TE1', beds: 0, area: 450, priceNum: 390_000, fin: 'comprar' as const },
    { codigo: 'AP2', beds: 2, area: 70, priceNum: 3_500, fin: 'alugar' as const },
  ];
  const codigos = (r: { itens: { codigo: string }[] }) => r.itens.map((i) => i.codigo);
  assert.deepEqual(codigos(filtrarImoveis(imoveis, lerFiltros({}))), ['AP1', 'CA1', 'TE1', 'AP2']);
  // Terreno não tem quartos: fica de fora e é contado.
  assert.deepEqual(filtrarImoveis(imoveis, lerFiltros({ quartos: '3' })), { itens: [imoveis[1]], semDado: 1 });
  assert.deepEqual(codigos(filtrarImoveis(imoveis, lerFiltros({ m2: '150' }))), ['CA1', 'TE1']);
  // Até R$ 600 mil: o aluguel de R$ 3.500/mês não passa por valor de venda.
  assert.deepEqual(filtrarImoveis(imoveis, lerFiltros({ valor: '600000' })), { itens: [imoveis[0], imoveis[2]], semDado: 1 });
});

test('filtros: só valores das opções valem na URL', () => {
  assert.deepEqual(lerFiltros({ quartos: '3', m2: '90', valor: '800000' }), { quartos: 3, m2: 90, valor: 800_000 });
  assert.deepEqual(lerFiltros({ quartos: '9', m2: '85', valor: 'abc' }), { quartos: null, m2: null, valor: null });
  assert.equal(temFiltro(lerFiltros({ quartos: '' })), false);
  assert.equal(temFiltro(lerFiltros({ m2: '120' })), true);
});

test('filtros: rótulo do valor em mil e milhão', () => {
  assert.equal(rotuloDeValor(400_000), '400 mil');
  assert.equal(rotuloDeValor(1_000_000), '1 milhão');
  assert.equal(rotuloDeValor(1_500_000), '1,5 milhão');
  assert.equal(rotuloDeValor(2_000_000), '2 milhões');
});

test('mapa: aceita o ID ou o link inteiro do My Maps e recusa o resto', () => {
  const id = 'AbCdEfGhIjKlMnOpQrStUvWxYz_-1234';
  const esperado = { embed: `https://www.google.com/maps/d/embed?mid=${id}`, abrir: `https://www.google.com/maps/d/viewer?mid=${id}` };
  assert.deepEqual(mapaDosLancamentos(id), esperado);
  assert.deepEqual(mapaDosLancamentos(`https://www.google.com/maps/d/u/1/edit?mid=${id}&usp=sharing`), esperado);
  // Sem `undefined` aqui: ele cairia no valor padrão, que lê a variável de ambiente.
  for (const valor of ['', '   ', 'curto', 'x" onload="alert(1)', `${id}"><script>`]) {
    assert.equal(mapaDosLancamentos(valor), null, String(valor));
  }
});
